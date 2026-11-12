import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import {
  hasPermission,
  isBuiltInRbacRole,
  isRbacPermission,
  RBAC_PERMISSION_SCOPES,
  RBAC_ROLES,
} from "../authz/rbac.js";
import type {
  BuiltInRbacRole,
  RbacCheckContext,
  RbacPermission,
  RbacPrincipal,
  RbacScope,
} from "../authz/rbac.js";
import { AccessGrant } from "../models/accessGrant.model.js";
import { Org } from "../models/organization.model.js";
import { Project } from "../models/project.model.js";
import { Secret } from "../models/secret.model.js";
import type { AuthRequest } from "../types/reqRes.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "./asycHandler.middleware.js";

interface AuthorizationContext extends RbacCheckContext {
  secretId?: string;
  environmentName?: string;
}

type ContextResolver = (req: Request) => Promise<AuthorizationContext>;
type IdSource = "params" | "body" | "query";

const requestId = (req: Request, source: IdSource, key: string): string => {
  const value = req[source][key];
  if (typeof value !== "string" || !value) {
    throw new AppError(`Valid ${key} is required`, 400);
  }
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(`Valid ${key} is required`, 400);
  }
  return value;
};

const userContext: ContextResolver = async (req) => {
  const userId = (req as AuthRequest).userId;
  if (!userId) throw new AppError("User not authenticated", 401);
  const scope: RbacScope = { type: "user", id: userId };
  return { targetScope: scope, scopePath: [scope] };
};

const organizationContext = async (
  organizationId: string,
): Promise<AuthorizationContext> => {
  const organization = await Org.findOne({
    _id: organizationId,
    isDeleted: false,
  }).select("_id");
  if (!organization) throw new AppError("Organization not found", 404);
  const scope: RbacScope = {
    type: "organization",
    id: organization._id.toString(),
  };
  return { targetScope: scope, scopePath: [scope] };
};

const projectContext = async (
  projectId: string,
): Promise<AuthorizationContext> => {
  const project = await Project.findOne({
    _id: projectId,
    isDeleted: false,
  }).select("_id orgId");
  if (!project) throw new AppError("Project not found", 404);
  const organizationScope: RbacScope = {
    type: "organization",
    id: project.orgId.toString(),
  };
  const projectScope: RbacScope = {
    type: "project",
    id: project._id.toString(),
  };
  return {
    targetScope: projectScope,
    scopePath: [organizationScope, projectScope],
  };
};

const environmentContext = async (
  projectId: string,
  environmentId: string,
): Promise<AuthorizationContext> => {
  const context = await projectContext(projectId);
  const project = await Project.findById(projectId).select("environments");
  const environment = project?.environments.find(
    (item) => item._id?.toString() === environmentId,
  );
  if (!environment) throw new AppError("Environment not found", 404);

  const environmentScope: RbacScope = {
    type: "environment",
    id: environmentId,
  };
  return {
    targetScope: environmentScope,
    scopePath: [...context.scopePath, environmentScope],
    environmentName: environment.name,
  };
};

const environmentByNameContext = async (
  projectId: string,
  environmentName: string,
): Promise<AuthorizationContext> => {
  const context = await projectContext(projectId);
  const project = await Project.findById(projectId).select("environments");
  const normalizedName = environmentName.trim().toLowerCase();
  const environment = project?.environments.find(
    (item) => item.name === normalizedName,
  );
  if (!environment?._id) {
    throw new AppError("Environment is not available in this project", 404);
  }

  const environmentScope: RbacScope = {
    type: "environment",
    id: environment._id.toString(),
  };
  return {
    targetScope: environmentScope,
    scopePath: [...context.scopePath, environmentScope],
    environmentName: environment.name,
  };
};

const secretContext = async (
  secretId: string,
): Promise<AuthorizationContext> => {
  const secret = await Secret.findOne({
    _id: secretId,
    isDeleted: false,
  }).select("_id projectId environment");
  if (!secret) throw new AppError("Secret not found", 404);

  const context = await projectContext(secret.projectId.toString());
  const project = await Project.findById(secret.projectId).select(
    "environments",
  );
  const environment = project?.environments.find(
    (item) => item.name === secret.environment,
  );
  if (!environment?._id) {
    throw new AppError("Secret environment not found", 404);
  }

  const environmentScope: RbacScope = {
    type: "environment",
    id: environment._id.toString(),
  };
  return {
    targetScope: environmentScope,
    scopePath: [...context.scopePath, environmentScope],
    secretId: secret._id.toString(),
    environmentName: environment.name,
  };
};

const makeResolver = (
  source: IdSource,
  key: string,
  type: "organization" | "project" | "environment" | "secret",
): ContextResolver => {
  return async (req) => {
    const id = requestId(req, source, key);
    if (type === "organization") return organizationContext(id);
    if (type === "project") return projectContext(id);
    if (type === "secret") return secretContext(id);

    const projectId = requestId(req, "params", "projectId");
    return environmentContext(projectId, id);
  };
};

const grantPermissions = (
  role: string,
  permissions: readonly string[],
): RbacPermission[] => {
  if (!isBuiltInRbacRole(role)) return [];
  const rolePermissions: readonly string[] = RBAC_ROLES[role].permissions;
  return permissions.filter(
    (permission): permission is RbacPermission =>
      isRbacPermission(permission) && rolePermissions.includes(permission),
  );
};

const resolvePrincipal = async (
  userId: string,
  context: AuthorizationContext,
): Promise<{ principal: RbacPrincipal; directSecretPermissions: RbacPermission[] }> => {
  const assignments: RbacPrincipal["assignments"][number][] = [
    {
      role: "accountUser",
      scope: { type: "user", id: userId },
    },
  ];

  const organizationScope = context.scopePath.find(
    (scope) => scope.type === "organization",
  );
  if (
    organizationScope &&
    (await Org.exists({
      _id: organizationScope.id,
      ownerId: userId,
      isDeleted: false,
    }))
  ) {
    assignments.push({
      role: "owner",
      scope: organizationScope,
      inheritToDescendants: true,
    });
  }

  const projectScope = context.scopePath.find(
    (scope) => scope.type === "project",
  );
  if (
    projectScope &&
    (await Project.exists({
      _id: projectScope.id,
      ownerId: userId,
      isDeleted: false,
    }))
  ) {
    assignments.push({
      role: "projectAdmin",
      scope: projectScope,
      inheritToDescendants: true,
    });
  }

  const grantScopes = context.scopePath.filter(
    (
      scope,
    ): scope is RbacScope & {
      type: "organization" | "project" | "environment";
    } =>
      scope.type === "organization" ||
      scope.type === "project" ||
      scope.type === "environment",
  );
  const grants = grantScopes.length
    ? await AccessGrant.find({
        userId,
        status: "active",
        resourceType: { $in: grantScopes.map((scope) => scope.type) },
        resourceId: { $in: grantScopes.map((scope) => scope.id) },
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      }).select("resourceType resourceId role permissions")
    : [];

  for (const grant of grants) {
    const scope = grantScopes.find(
      (item) =>
        item.type === grant.resourceType &&
        item.id === grant.resourceId.toString(),
    );
    if (!scope) continue;

    assignments.push({
      role: grant.role,
      scope,
      inheritToDescendants: true,
      permissions: grantPermissions(grant.role, grant.permissions),
    });
  }

  const directSecretGrants =
    context.secretId && context.targetScope.type === "environment"
      ? await AccessGrant.find({
          userId,
          resourceType: "secret",
          resourceId: context.secretId,
          status: "active",
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        }).select("role permissions")
      : [];
  const directSecretPermissions = [
    ...new Set(
      directSecretGrants.flatMap((grant) =>
        grantPermissions(grant.role, grant.permissions),
      ),
    ),
  ];

  return { principal: { assignments }, directSecretPermissions };
};

const assertPermissions = async (
  userId: string,
  permissions: readonly RbacPermission[],
  context: AuthorizationContext,
): Promise<void> => {
  const { principal, directSecretPermissions } = await resolvePrincipal(
    userId,
    context,
  );
  for (const permission of permissions) {
    const directSecretAllowed =
      context.secretId !== undefined &&
      directSecretPermissions.includes(permission);
    if (
      !hasPermission(principal, permission, context) &&
      !directSecretAllowed
    ) {
      throw new AppError(
        `You do not have permission to perform this action (${permission})`,
        403,
      );
    }
  }

  if (
    permissions.includes("secret:value:read") &&
    context.environmentName?.toLowerCase() === "production"
  ) {
    const productionPermission: RbacPermission =
      "secret:value:read:production";
    if (
      !hasPermission(principal, productionPermission, context) &&
      !directSecretPermissions.includes(productionPermission)
    ) {
      throw new AppError(
        "You do not have permission to reveal production secret values",
        403,
      );
    }
  }
};

const rolePermissionsForAssignment = (
  role: BuiltInRbacRole,
  resourceType: "organization" | "project" | "environment" | "secret",
  organizationWide = false,
): RbacPermission[] =>
  RBAC_ROLES[role].permissions.filter((permission) => {
    const scopes = RBAC_PERMISSION_SCOPES[permission];
    if (resourceType === "organization") {
      return (
        scopes.some((scope) => scope === "organization") ||
        (organizationWide &&
          scopes.some(
            (scope) => scope === "project" || scope === "environment",
          ))
      );
    }
    if (resourceType === "project") {
      return scopes.some(
        (scope) => scope === "project" || scope === "environment",
      );
    }
    if (resourceType === "environment") {
      return scopes.some((scope) => scope === "environment");
    }
    return permission.startsWith("secret:");
  });

const assignmentCheckContext = (
  context: AuthorizationContext,
  permission: RbacPermission,
): AuthorizationContext => {
  const allowedScopes = RBAC_PERMISSION_SCOPES[permission];
  if (allowedScopes.some((scope) => scope === context.targetScope.type)) {
    return context;
  }

  const projectScope = context.scopePath.find(
    (scope) => scope.type === "project",
  );
  const organizationScope = context.scopePath.find(
    (scope) => scope.type === "organization",
  );
  const targetType = allowedScopes.some((scope) => scope === "project")
    ? "project"
    : allowedScopes.some((scope) => scope === "environment")
      ? "environment"
      : undefined;
  if (!targetType || !organizationScope) return context;

  const project =
    projectScope ??
    ({
      type: "project",
      id: `rbac-check-${organizationScope.id}`,
    } satisfies RbacScope);
  const path = projectScope
    ? [...context.scopePath]
    : [...context.scopePath, project];
  if (targetType === "project") {
    return { targetScope: project, scopePath: path };
  }

  const environment: RbacScope = {
    type: "environment",
    id: `rbac-check-${project.id}`,
  };
  return {
    targetScope: environment,
    scopePath: [...path, environment],
  };
};

const assertCanAssignRole = async (
  userId: string,
  roleValue: unknown,
  resourceType: "organization" | "project" | "environment" | "secret",
  context: AuthorizationContext,
  organizationWide = false,
): Promise<void> => {
  if (typeof roleValue !== "string" || !isBuiltInRbacRole(roleValue)) {
    throw new AppError("Invalid sharing role", 400);
  }

  const { principal, directSecretPermissions } = await resolvePrincipal(
    userId,
    context,
  );
  const permissions = rolePermissionsForAssignment(
    roleValue,
    resourceType,
    organizationWide,
  );
  if (!permissions.length) {
    throw new AppError("The selected role cannot be assigned to this resource", 400);
  }
  for (const permission of permissions) {
    const permissionContext = assignmentCheckContext(context, permission);
    if (
      !hasPermission(principal, permission, permissionContext) &&
      !directSecretPermissions.includes(permission)
    ) {
      throw new AppError(
        `You cannot assign ${roleValue}; you lack ${permission}`,
        403,
      );
    }
  }
};

export const requirePermission = (
  permission: RbacPermission,
  resolveContext: ContextResolver,
) =>
  asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.userId) throw new AppError("User not authenticated", 401);
    const context = await resolveContext(req);
    await assertPermissions(req.userId, [permission], context);
    next();
  });

export const requireAllPermissions = (
  permissions: readonly RbacPermission[],
  resolveContext: ContextResolver,
) =>
  asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.userId) throw new AppError("User not authenticated", 401);
    const context = await resolveContext(req);
    await assertPermissions(req.userId, permissions, context);
    next();
  });

export const requireSecretUpdatePermissions = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.userId) throw new AppError("User not authenticated", 401);
    const body = req.body as { key?: unknown; value?: unknown };
    const permissions: RbacPermission[] = [];
    if (body.key !== undefined) permissions.push("secret:key:update");
    if (body.value !== undefined) permissions.push("secret:value:update");
    if (!permissions.length) {
      throw new AppError("Provide a secret key or value to update", 400);
    }

    await assertPermissions(
      req.userId,
      permissions,
      await secretContext(requestId(req, "params", "secretId")),
    );
    next();
  },
);

export const requireSecretListPermission = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.userId) throw new AppError("User not authenticated", 401);
    const projectId = requestId(req, "query", "projectId");
    const context = await projectContext(projectId);
    const { principal } = await resolvePrincipal(req.userId, context);

    if (hasPermission(principal, "secret:list", context)) {
      next();
      return;
    }

    const secrets = await Secret.find({
      projectId,
      isDeleted: false,
    }).select("_id");
    const secretIds = secrets.map((secret) => secret._id);
    const directGrants = secretIds.length
      ? await AccessGrant.find({
          userId: req.userId,
          resourceType: "secret",
          resourceId: { $in: secretIds },
          status: "active",
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        }).select("resourceId role permissions")
      : [];
    const authorizedSecretIds = [
      ...new Set(
        directGrants
          .filter((grant) =>
            grantPermissions(grant.role, grant.permissions).includes(
              "secret:list",
            ),
          )
          .map((grant) => grant.resourceId.toString()),
      ),
    ];
    if (!authorizedSecretIds.length) {
      throw new AppError(
        "You do not have permission to perform this action (secret:list)",
        403,
      );
    }
    req.authorizedSecretIds = authorizedSecretIds;
    next();
  },
);

export const rbacContexts = {
  user: userContext,
  organizationParam: (key = "organizationId") =>
    makeResolver("params", key, "organization"),
  organizationBody: (key = "orgId") =>
    makeResolver("body", key, "organization"),
  projectParam: (key = "projectId") =>
    makeResolver("params", key, "project"),
  projectBody: (key = "projectId") =>
    makeResolver("body", key, "project"),
  projectQuery: (key = "projectId") =>
    makeResolver("query", key, "project"),
  environmentParam: (key = "environmentId") =>
    makeResolver("params", key, "environment"),
  secretParam: (key = "secretId") =>
    makeResolver("params", key, "secret"),
  secretCreate: async (req: Request) => {
    const projectId = requestId(req, "body", "projectId");
    const body = req.body as { environment?: unknown };
    const environmentName =
      typeof body.environment === "string" && body.environment
        ? body.environment
        : "development";
    return environmentByNameContext(projectId, environmentName);
  },
  secretList: async (req: Request) => {
    const projectId = requestId(req, "query", "projectId");
    return projectContext(projectId);
  },
};

export const requireShareInvitationPermissions = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.userId) throw new AppError("User not authenticated", 401);
    const body = req.body as {
      orgId?: unknown;
      projectId?: unknown;
      secretId?: unknown;
      role?: unknown;
    };
    if (typeof body.orgId !== "string") {
      throw new AppError("Valid orgId is required", 400);
    }
    if (typeof body.role !== "string" || !isBuiltInRbacRole(body.role)) {
      throw new AppError("Invalid sharing role", 400);
    }

    const projectIds = Array.isArray(body.projectId)
      ? body.projectId.filter((id): id is string => typeof id === "string")
      : [];
    const secretIds = Array.isArray(body.secretId)
      ? body.secretId.filter((id): id is string => typeof id === "string")
      : [];

    if (!projectIds.length && !secretIds.length) {
      const context = await organizationContext(body.orgId);
      await assertPermissions(
        req.userId,
        ["organization:members:invite", "organization:members:role:assign"],
        context,
      );
      await assertCanAssignRole(
        req.userId,
        body.role,
        "organization",
        context,
        true,
      );
    }

    for (const projectId of projectIds) {
      const context = await projectContext(projectId);
      await assertPermissions(
        req.userId,
        ["project:members:invite", "project:members:role:assign"],
        context,
      );
      await assertCanAssignRole(
        req.userId,
        body.role,
        "project",
        context,
      );
    }

    for (const secretId of secretIds) {
      const context = await secretContext(secretId);
      await assertPermissions(
        req.userId,
        ["secret:share"],
        context,
      );
      await assertCanAssignRole(
        req.userId,
        body.role,
        "secret",
        context,
      );
    }
    next();
  },
);
