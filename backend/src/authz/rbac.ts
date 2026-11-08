export const RBAC_SCOPES = [
  "global",
  "user",
  "organization",
  "project",
  "environment",
] as const;

export type RbacScopeType = (typeof RBAC_SCOPES)[number];

export interface RbacScope {
  type: RbacScopeType;
  id: string;
}

export const RBAC_PERMISSIONS = [
  "platform:users:read",
  "platform:users:suspend",
  "platform:organizations:read",
  "platform:organizations:manage",
  "platform:audit:read",
  "platform:settings:manage",
  "organization:create",
  "organization:read",
  "organization:update",
  "organization:delete",
  "organization:restore",
  "organization:transfer_owner",
  "organization:visibility:manage",
  "organization:projects:list",
  "organization:projects:create",
  "organization:members:list",
  "organization:members:invite",
  "organization:members:remove",
  "organization:members:role:read",
  "organization:members:role:assign",
  "organization:members:role:revoke",
  "organization:roles:list",
  "organization:roles:create",
  "organization:roles:update",
  "organization:roles:delete",
  "organization:audit:read",
  "project:create",
  "project:list",
  "project:list_all",
  "project:read",
  "project:update",
  "project:delete",
  "project:restore",
  "project:transfer_owner",
  "project:visibility:manage",
  "project:members:list",
  "project:members:invite",
  "project:members:remove",
  "project:members:role:read",
  "project:members:role:assign",
  "project:members:role:revoke",
  "project:audit:read",
  "environment:list",
  "environment:read",
  "environment:create",
  "environment:rename",
  "environment:delete",
  "environment:access:grant",
  "environment:access:revoke",
  "secret:list",
  "secret:metadata:read",
  "secret:create",
  "secret:key:update",
  "secret:value:update",
  "secret:metadata:update",
  "secret:delete",
  "secret:restore",
  "secret:value:read",
  "secret:value:read:production",
  "secret:export",
  "secret:share",
  "secret:version:list",
  "secret:version:read",
  "secret:version:restore",
  "integration:list",
  "integration:read",
  "integration:create",
  "integration:update",
  "integration:delete",
  "integration:credential:read",
  "deployment:trigger",
  "deployment:status:read",
  "automation:token:create",
  "automation:token:list",
  "automation:token:revoke",
  "audit:read",
  "audit:export",
  "policy:read",
  "policy:update",
  "billing:read",
  "billing:update",
] as const;

export type RbacPermission = (typeof RBAC_PERMISSIONS)[number];

export const RBAC_PERMISSION_SCOPES = {
  "platform:users:read": ["global"],
  "platform:users:suspend": ["global"],
  "platform:organizations:read": ["global"],
  "platform:organizations:manage": ["global"],
  "platform:audit:read": ["global"],
  "platform:settings:manage": ["global"],
  "organization:create": ["user"],
  "organization:read": ["organization"],
  "organization:update": ["organization"],
  "organization:delete": ["organization"],
  "organization:restore": ["organization"],
  "organization:transfer_owner": ["organization"],
  "organization:visibility:manage": ["organization"],
  "organization:projects:list": ["organization"],
  "organization:projects:create": ["organization"],
  "organization:members:list": ["organization"],
  "organization:members:invite": ["organization"],
  "organization:members:remove": ["organization"],
  "organization:members:role:read": ["organization"],
  "organization:members:role:assign": ["organization"],
  "organization:members:role:revoke": ["organization"],
  "organization:roles:list": ["organization"],
  "organization:roles:create": ["organization"],
  "organization:roles:update": ["organization"],
  "organization:roles:delete": ["organization"],
  "organization:audit:read": ["organization"],
  "project:create": ["organization"],
  "project:list": ["organization"],
  "project:list_all": ["organization"],
  "project:read": ["project"],
  "project:update": ["project"],
  "project:delete": ["project"],
  "project:restore": ["project"],
  "project:transfer_owner": ["project"],
  "project:visibility:manage": ["project"],
  "project:members:list": ["project"],
  "project:members:invite": ["project"],
  "project:members:remove": ["project"],
  "project:members:role:read": ["project"],
  "project:members:role:assign": ["project"],
  "project:members:role:revoke": ["project"],
  "project:audit:read": ["project"],
  "environment:list": ["project"],
  "environment:read": ["environment"],
  "environment:create": ["project"],
  "environment:rename": ["environment"],
  "environment:delete": ["environment"],
  "environment:access:grant": ["project"],
  "environment:access:revoke": ["project"],
  "secret:list": ["project", "environment"],
  "secret:metadata:read": ["project", "environment"],
  "secret:create": ["project", "environment"],
  "secret:key:update": ["project", "environment"],
  "secret:value:update": ["project", "environment"],
  "secret:metadata:update": ["project", "environment"],
  "secret:delete": ["project", "environment"],
  "secret:restore": ["project", "environment"],
  "secret:value:read": ["project", "environment"],
  "secret:value:read:production": ["environment"],
  "secret:export": ["project", "environment"],
  "secret:share": ["project", "environment"],
  "secret:version:list": ["project", "environment"],
  "secret:version:read": ["project", "environment"],
  "secret:version:restore": ["project", "environment"],
  "integration:list": ["project"],
  "integration:read": ["project"],
  "integration:create": ["project"],
  "integration:update": ["project"],
  "integration:delete": ["project"],
  "integration:credential:read": ["project", "environment"],
  "deployment:trigger": ["project", "environment"],
  "deployment:status:read": ["project", "environment"],
  "automation:token:create": ["project"],
  "automation:token:list": ["project"],
  "automation:token:revoke": ["project"],
  "audit:read": ["organization", "project"],
  "audit:export": ["organization", "project"],
  "policy:read": ["organization"],
  "policy:update": ["organization"],
  "billing:read": ["organization"],
  "billing:update": ["organization"],
} as const satisfies Record<RbacPermission, readonly RbacScopeType[]>;

export const RBAC_ROLES = {
  owner: {
    name: "Owner",
    description: "Full customer-level access within the assigned organization.",
    permissions: [
      "organization:read",
      "organization:update",
      "organization:delete",
      "organization:restore",
      "organization:transfer_owner",
      "organization:visibility:manage",
      "organization:projects:list",
      "organization:projects:create",
      "organization:members:list",
      "organization:members:invite",
      "organization:members:remove",
      "organization:members:role:read",
      "organization:members:role:assign",
      "organization:members:role:revoke",
      "organization:roles:list",
      "organization:roles:create",
      "organization:roles:update",
      "organization:roles:delete",
      "organization:audit:read",
      "project:create",
      "project:list",
      "project:list_all",
      "project:read",
      "project:update",
      "project:delete",
      "project:restore",
      "project:transfer_owner",
      "project:visibility:manage",
      "project:members:list",
      "project:members:invite",
      "project:members:remove",
      "project:members:role:read",
      "project:members:role:assign",
      "project:members:role:revoke",
      "project:audit:read",
      "environment:list",
      "environment:read",
      "environment:create",
      "environment:rename",
      "environment:delete",
      "environment:access:grant",
      "environment:access:revoke",
      "secret:list",
      "secret:metadata:read",
      "secret:create",
      "secret:key:update",
      "secret:value:update",
      "secret:metadata:update",
      "secret:delete",
      "secret:restore",
      "secret:value:read",
      "secret:value:read:production",
      "secret:export",
      "secret:share",
      "secret:version:list",
      "secret:version:read",
      "secret:version:restore",
      "integration:list",
      "integration:read",
      "integration:create",
      "integration:update",
      "integration:delete",
      "integration:credential:read",
      "deployment:trigger",
      "deployment:status:read",
      "automation:token:create",
      "automation:token:list",
      "automation:token:revoke",
      "audit:read",
      "audit:export",
      "policy:read",
      "policy:update",
      "billing:read",
      "billing:update",
    ],
  },
  organizationAdmin: {
    name: "Organization Admin",
    description: "Manages organization settings, members, roles, and projects.",
    permissions: [
      "organization:read",
      "organization:update",
      "organization:visibility:manage",
      "organization:projects:list",
      "organization:projects:create",
      "organization:members:list",
      "organization:members:invite",
      "organization:members:remove",
      "organization:members:role:read",
      "organization:members:role:assign",
      "organization:members:role:revoke",
      "organization:roles:list",
      "organization:roles:create",
      "organization:roles:update",
      "organization:roles:delete",
      "organization:audit:read",
      "project:create",
      "project:list",
      "project:list_all",
    ],
  },
  projectAdmin: {
    name: "Project Admin",
    description: "Manages one project, its environments, and its access.",
    permissions: [
      "project:read",
      "project:update",
      "project:delete",
      "project:restore",
      "project:transfer_owner",
      "project:visibility:manage",
      "project:members:list",
      "project:members:invite",
      "project:members:remove",
      "project:members:role:read",
      "project:members:role:assign",
      "project:members:role:revoke",
      "project:audit:read",
      "environment:list",
      "environment:read",
      "environment:create",
      "environment:rename",
      "environment:delete",
      "environment:access:grant",
      "environment:access:revoke",
      "secret:list",
      "secret:metadata:read",
      "secret:create",
      "secret:key:update",
      "secret:value:update",
      "secret:metadata:update",
      "secret:delete",
      "secret:restore",
      "secret:value:read",
      "secret:export",
      "secret:share",
      "secret:version:list",
      "secret:version:read",
      "secret:version:restore",
      "integration:list",
      "integration:read",
      "integration:create",
      "integration:update",
      "integration:delete",
      "integration:credential:read",
      "deployment:trigger",
      "deployment:status:read",
      "automation:token:create",
      "automation:token:list",
      "automation:token:revoke",
      "audit:read",
      "audit:export",
    ],
  },
  secretManager: {
    name: "Secret Manager",
    description: "Manages secrets without project or member administration.",
    permissions: [
      "project:read",
      "environment:list",
      "environment:read",
      "secret:list",
      "secret:metadata:read",
      "secret:create",
      "secret:key:update",
      "secret:value:update",
      "secret:metadata:update",
      "secret:delete",
      "secret:restore",
      "secret:value:read",
      "secret:version:list",
      "secret:version:read",
      "secret:version:restore",
    ],
  },
  developer: {
    name: "Developer",
    description: "Works with secrets in explicitly granted non-production environments.",
    permissions: [
      "project:read",
      "environment:list",
      "environment:read",
      "secret:list",
      "secret:metadata:read",
      "secret:create",
      "secret:key:update",
      "secret:value:update",
      "secret:metadata:update",
      "secret:delete",
    ],
  },
  deployer: {
    name: "Deployer",
    description: "Triggers and monitors scoped deployments without broad secret access.",
    permissions: [
      "project:read",
      "environment:list",
      "environment:read",
      "deployment:trigger",
      "deployment:status:read",
    ],
  },
  viewer: {
    name: "Viewer",
    description: "Reads project and secret metadata without revealing values.",
    permissions: [
      "project:read",
      "environment:list",
      "environment:read",
      "secret:list",
      "secret:metadata:read",
    ],
  },
  auditor: {
    name: "Auditor",
    description: "Reviews configuration metadata and scoped audit history.",
    permissions: [
      "organization:read",
      "organization:members:list",
      "organization:members:role:read",
      "organization:audit:read",
      "project:read",
      "project:members:list",
      "project:members:role:read",
      "project:audit:read",
      "environment:list",
      "environment:read",
      "secret:list",
      "secret:metadata:read",
      "secret:version:list",
      "audit:read",
      "audit:export",
    ],
  },
  billingAdmin: {
    name: "Billing Admin",
    description: "Views and manages billing settings for an organization.",
    permissions: ["organization:read", "billing:read", "billing:update"],
  },
  organizationCreator: {
    name: "Organization Creator",
    description: "Can create organizations for the assigned user account.",
    permissions: ["organization:create"],
  },
} as const satisfies Record<
  string,
  {
    name: string;
    description: string;
    permissions: readonly RbacPermission[];
  }
>;

export type BuiltInRbacRole = keyof typeof RBAC_ROLES;

export interface RbacRoleAssignment {
  role: string;
  scope: RbacScope;
  inheritToDescendants?: boolean;
  /**
   * Resolved permissions for a custom role. Populate only from trusted
   * persisted role data; never copy this value directly from a client request.
   */
  permissions?: readonly RbacPermission[];
}

export interface RbacPrincipal {
  assignments: readonly RbacRoleAssignment[];
}

export interface RbacCheckContext {
  targetScope: RbacScope;
  /** Ordered from the resource's outermost scope to its target scope. */
  scopePath: readonly RbacScope[];
}

export const isRbacPermission = (value: string): value is RbacPermission =>
  (RBAC_PERMISSIONS as readonly string[]).includes(value);

export const isBuiltInRbacRole = (value: string): value is BuiltInRbacRole =>
  Object.hasOwn(RBAC_ROLES, value);

export const getBuiltInRolePermissions = (
  role: BuiltInRbacRole,
): readonly RbacPermission[] => RBAC_ROLES[role].permissions;

export const roleHasPermission = (
  role: BuiltInRbacRole,
  permission: RbacPermission,
): boolean =>
  RBAC_ROLES[role].permissions.some((item) => item === permission);

const assignmentAppliesToScope = (
  assignment: RbacRoleAssignment,
  context: RbacCheckContext,
): boolean => {
  if (assignment.scope.type === "global") return true;

  const assignmentIndex = context.scopePath.findIndex(
    (scope) =>
      scope.type === assignment.scope.type && scope.id === assignment.scope.id,
  );

  if (assignmentIndex === -1) return false;

  const targetIndex = context.scopePath.findIndex(
    (scope) =>
      scope.type === context.targetScope.type &&
      scope.id === context.targetScope.id,
  );

  return (
    targetIndex === assignmentIndex ||
    (assignment.inheritToDescendants === true && targetIndex > assignmentIndex)
  );
};

export const hasPermission = (
  principal: RbacPrincipal,
  permission: RbacPermission,
  context: RbacCheckContext,
): boolean => {
  if (
    !RBAC_PERMISSION_SCOPES[permission].some(
      (scopeType) => scopeType === context.targetScope.type,
    )
  ) {
    return false;
  }

  return principal.assignments.some(
    (assignment) => {
      const permissions = isBuiltInRbacRole(assignment.role)
        ? RBAC_ROLES[assignment.role].permissions
        : assignment.permissions;

      return (
        permissions?.some((item) => item === permission) === true &&
        assignmentAppliesToScope(assignment, context)
      );
    },
  );
};

export const hasAllPermissions = (
  principal: RbacPrincipal,
  permissions: readonly RbacPermission[],
  context: RbacCheckContext,
): boolean =>
  permissions.every((permission) =>
    hasPermission(principal, permission, context),
  );

export const hasAnyPermission = (
  principal: RbacPrincipal,
  permissions: readonly RbacPermission[],
  context: RbacCheckContext,
): boolean =>
  permissions.some((permission) =>
    hasPermission(principal, permission, context),
  );

export const canRevealSecretValue = (
  principal: RbacPrincipal,
  environmentName: string,
  context: RbacCheckContext,
): boolean => {
  if (
    !hasPermission(principal, "secret:value:read", context) ||
    (environmentName.toLowerCase() === "production" &&
      !hasPermission(
        principal,
        "secret:value:read:production",
        context,
      ))
  ) {
    return false;
  }

  return true;
};
