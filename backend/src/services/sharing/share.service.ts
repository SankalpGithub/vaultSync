import { Types } from "mongoose";
import { env } from "../../configs/env.config.js";
import { SendShareInvitationRepository } from "../../repository/sendShareInvitation.repository.js";
import { UserRepository } from "../../repository/user.repository.js";
import type { ResponseData } from "../../types/reqRes.js";
import { AppError } from "../../utils/appError.js";
import { sendEmail } from "../mailjet.service.js";
import { shareInvitations } from "../../models/shareInvitation.model.js";
import { AccessGrant } from "../../models/accessGrant.model.js";
import { Org } from "../../models/organization.model.js";
import { Project } from "../../models/project.model.js";
import { Secret } from "../../models/secret.model.js";
import { randomBytes, createHash } from "node:crypto";
import {
  getBuiltInRolePermissions,
  isBuiltInRbacRole,
} from "../../authz/rbac.js";

export interface ISendShareInvitationRequest {
  sharerId: string;
  recipientEmails: string[];
  orgId: string;
  projectId: string[];
  secretId: string[];
  role: string;
}

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });

export const handleShareInvitation = async (
  body: ISendShareInvitationRequest,
): Promise<ResponseData> => {
  if (!isBuiltInRbacRole(body.role)) {
    throw new AppError("Invalid sharing role", 400);
  }

  const recipientEmails = [
    ...new Set(body.recipientEmails.map((email) => email.trim().toLowerCase())),
  ];
  const recipients = await UserRepository.findUsersByEmails(recipientEmails);
  const recipientsByEmail = new Map(
    recipients.map((recipient) => [recipient.email.toLowerCase(), recipient]),
  );
  const missingRecipients = recipientEmails.filter(
    (email) => !recipientsByEmail.has(email),
  );
  if (missingRecipients.length) {
    throw new AppError(
      `No VaultSync account found for: ${missingRecipients.join(", ")}`,
      404,
    );
  }

  const sharer = (await UserRepository.findUsersByIds([body.sharerId]))[0];
  if (!sharer) throw new AppError("Sharer not found", 404);

  const orgId = new Types.ObjectId(body.orgId);
  const org = await Org.findOne({ _id: orgId, isDeleted: false });
  if (!org) throw new AppError("Organization not found", 404);

  const selectedProjectIds = [
    ...new Set(body.projectId.map((id) => new Types.ObjectId(id).toString())),
  ].map((id) => new Types.ObjectId(id));

  const secretIds = [
    ...new Set(body.secretId.map((id) => new Types.ObjectId(id).toString())),
  ].map((id) => new Types.ObjectId(id));
  const secrets = secretIds.length
    ? await Secret.find({ _id: { $in: secretIds }, isDeleted: false }).select(
        "_id projectId",
      )
    : [];
  if (secrets.length !== secretIds.length) {
    throw new AppError("One or more secrets were not found", 404);
  }

  const allProjectIds = [
    ...new Set([
      ...selectedProjectIds.map(String),
      ...secrets.map((secret) => secret.projectId.toString()),
    ]),
  ].map((id) => new Types.ObjectId(id));
  const projects = allProjectIds.length
    ? await Project.find({
        _id: { $in: allProjectIds },
        orgId,
        isDeleted: false,
      }).select("_id name")
    : [];
  if (projects.length !== allProjectIds.length) {
    throw new AppError(
      "One or more projects do not belong to this organization",
      400,
    );
  }

  const projectsById = new Map(
    projects.map((project) => [project._id.toString(), project]),
  );

  const permissions = getBuiltInRolePermissions(body.role);
  const projectNames = allProjectIds
    .map((id) => projectsById.get(id.toString())?.name)
    .filter((name): name is string => name !== undefined);
  const invitationUrl = new URL("/share", env.FRONTEND_URL);

  const createdInvitations: Array<{
    invitationId: string;
    recipientEmail: string;
    status: string;
  }> = [];

  for (const recipientEmail of recipientEmails) {
    const recipient = recipientsByEmail.get(recipientEmail);
    if (!recipient) throw new AppError("Recipient not found", 404);

    const token = randomBytes(32).toString("hex");
    const invitation =
      await SendShareInvitationRepository.createSendShareInvitation({
        sharerId: new Types.ObjectId(body.sharerId),
        recipientId: recipient._id,
        recipientEmail: recipient.email,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        orgId,
        orgPermissions: permissions.filter((permission) =>
          permission.startsWith("organization:"),
        ),
        projectId: selectedProjectIds,
        projectPermissions: permissions.filter((permission) =>
          permission.startsWith("project:"),
        ),
        environment: [],
        secretId: secretIds,
        secretPermission: permissions.filter((permission) =>
          permission.startsWith("secret:"),
        ),
        role: body.role,
      });

    invitationUrl.search = new URLSearchParams({
      invitationId: invitation._id.toString(),
      token,
    }).toString();
    const projectSummary = projectNames.length
      ? `Projects: ${projectNames.join(", ")}`
      : "Organization-wide access";
    const subject = `You've been invited to ${org.name}`;
    const text = [
      `${sharer.name} (${sharer.email}) invited you to access ${org.name}.`,
      projectSummary,
      `Role: ${body.role}`,
      `Accept the invitation: ${invitationUrl.toString()}`,
    ].join("\n");
    const html = `<p>${escapeHtml(sharer.name)} (${escapeHtml(sharer.email)}) invited you to access <strong>${escapeHtml(org.name)}</strong>.</p><p>${escapeHtml(projectSummary)}</p><p>Role: ${escapeHtml(body.role)}</p><p><a href="${escapeHtml(invitationUrl.toString())}">Review invitation</a></p>`;

    await sendEmail(recipient.email, subject, text, html);
    createdInvitations.push({
      invitationId: invitation._id.toString(),
      recipientEmail: recipient.email,
      status: invitation.status ?? "pending",
    });
  }

  return {
    success: true,
    message: "Share invitation created and sent",
    data: { invitations: createdInvitations },
    statusCode: 201,
  };
};

const invitationFilter = (invitationId: string, userId: string) => ({
  _id: new Types.ObjectId(invitationId),
  recipientId: new Types.ObjectId(userId),
  status: "pending" as const,
});

export const getReceivedInvitations = async (
  userId: string,
  status?: string,
): Promise<ResponseData> => ({
  success: true,
  message: "Received invitations fetched successfully",
  data: await shareInvitations
    .find({
      recipientId: new Types.ObjectId(userId),
      ...(status
        ? {
            status: status as
              | "pending"
              | "accepted"
              | "rejected"
              | "revoked"
              | "expired"
              | "cancelled",
          }
        : {}),
    })
    .sort({ createdAt: -1 }),
  statusCode: 200,
});

export const getSentInvitations = async (
  userId: string,
  status?: string,
): Promise<ResponseData> => ({
  success: true,
  message: "Sent invitations fetched successfully",
  data: await shareInvitations
    .find({
      sharerId: new Types.ObjectId(userId),
      ...(status
        ? {
            status: status as
              | "pending"
              | "accepted"
              | "rejected"
              | "revoked"
              | "expired"
              | "cancelled",
          }
        : {}),
    })
    .sort({ createdAt: -1 }),
  statusCode: 200,
});

export const acceptShareInvitation = async (
  invitationId: string,
  userId: string,
  token?: string,
): Promise<ResponseData> => {
  const invitation = await shareInvitations.findOne(
    invitationFilter(invitationId, userId),
  );
  if (!invitation)
    throw new AppError("Invitation not found or already responded to", 404);
  if (token) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const invitationWithHash = await shareInvitations
      .findOne({
        _id: invitation._id,
        tokenHash,
      })
      .select("+tokenHash");
    if (!invitationWithHash)
      throw new AppError("Invalid invitation token", 403);
  }
  if (invitation.expiresAt && invitation.expiresAt <= new Date()) {
    await shareInvitations.updateOne(
      { _id: invitation._id },
      { $set: { status: "expired" } },
    );
    throw new AppError("Invitation has expired", 410);
  }
  const firstProjectId = invitation.projectId[0];
  const project = firstProjectId
    ? await Project.findOne({
        _id: firstProjectId,
        orgId: invitation.orgId,
        isDeleted: false,
      })
    : null;
  const targets: Array<{
    resourceType: "organization" | "project" | "environment" | "secret";
    resourceId: Types.ObjectId;
    projectId?: Types.ObjectId;
    permissions: string[];
  }> = [
    {
      resourceType: "organization",
      resourceId: invitation.orgId,
      permissions: invitation.orgPermissions,
    },
    ...invitation.projectId.map((id) => ({
      resourceType: "project" as const,
      resourceId: id,
      permissions: invitation.projectPermissions,
    })),
    ...invitation.environment.map((item) => ({
      resourceType: "environment" as const,
      resourceId: item.envId,
      ...(project ? { projectId: project._id } : {}),
      permissions: item.permissions,
    })),
    ...invitation.secretId.map((id) => ({
      resourceType: "secret" as const,
      resourceId: id,
      permissions: invitation.secretPermission,
    })),
  ];
  await shareInvitations.updateOne(
    { _id: invitation._id, status: "pending" },
    { $set: { status: "accepted", respondedAt: new Date() } },
  );
  await AccessGrant.insertMany(
    targets.map((target) => ({
      invitationId: invitation._id,
      userId: invitation.recipientId,
      grantedBy: invitation.sharerId,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      ...target,
    })),
    { ordered: false },
  );
  return {
    success: true,
    message: "Invitation accepted",
    data: { invitationId: invitation._id.toString() },
    statusCode: 200,
  };
};

export const rejectShareInvitation = async (
  invitationId: string,
  userId: string,
): Promise<ResponseData> => {
  const invitation = await shareInvitations.findOneAndUpdate(
    invitationFilter(invitationId, userId),
    { $set: { status: "rejected", respondedAt: new Date() } },
    { new: true },
  );
  if (!invitation)
    throw new AppError("Invitation not found or already responded to", 404);
  return {
    success: true,
    message: "Invitation rejected",
    data: { invitationId: invitation._id.toString() },
    statusCode: 200,
  };
};

export const cancelShareInvitation = async (
  invitationId: string,
  userId: string,
): Promise<ResponseData> => {
  const invitation = await shareInvitations.findOneAndUpdate(
    {
      _id: new Types.ObjectId(invitationId),
      sharerId: new Types.ObjectId(userId),
      status: "pending",
    },
    { $set: { status: "cancelled", respondedAt: new Date() } },
    { new: true },
  );
  if (!invitation) throw new AppError("Pending invitation not found", 404);
  return {
    success: true,
    message: "Invitation cancelled",
    data: { invitationId: invitation._id.toString() },
    statusCode: 200,
  };
};

export const listGrants = async (
  userId: string,
  resourceType?: string,
  resourceId?: string,
): Promise<ResponseData> => ({
  success: true,
  message: "Access grants fetched successfully",
  data: await AccessGrant.find({
    $or: [
      { userId: new Types.ObjectId(userId) },
      { grantedBy: new Types.ObjectId(userId) },
    ],
    ...(resourceType
      ? {
          resourceType: resourceType as
            | "organization"
            | "project"
            | "environment"
            | "secret",
        }
      : {}),
    ...(resourceId && { resourceId: new Types.ObjectId(resourceId) }),
  }).sort({ createdAt: -1 }),
  statusCode: 200,
});

export const updateShareGrant = async (
  grantId: string,
  userId: string,
  body: { role?: string; permissions?: string[]; expiresAt?: string | null },
): Promise<ResponseData> => {
  const grant = await AccessGrant.findOneAndUpdate(
    {
      _id: new Types.ObjectId(grantId),
      grantedBy: new Types.ObjectId(userId),
      status: "active",
    },
    {
      $set: {
        ...(body.role && { role: body.role }),
        ...(body.permissions && { permissions: body.permissions }),
        ...(body.expiresAt !== undefined && {
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        }),
      },
    },
    { new: true },
  );
  if (!grant)
    throw new AppError("Grant not found or you cannot manage it", 404);
  return {
    success: true,
    message: "Access grant updated",
    data: grant,
    statusCode: 200,
  };
};

export const revokeShareGrant = async (
  grantId: string,
  userId: string,
): Promise<ResponseData> => {
  const grants = await AccessGrant.updateMany(
    {
      $or: [
        {
          _id: new Types.ObjectId(grantId),
          grantedBy: new Types.ObjectId(userId),
        },
        {
          invitationId: new Types.ObjectId(grantId),
          grantedBy: new Types.ObjectId(userId),
        },
      ],
    },
    {
      $set: {
        status: "revoked",
        revokedAt: new Date(),
        revokedBy: new Types.ObjectId(userId),
      },
    },
  );
  if (!grants.modifiedCount)
    throw new AppError("Grant not found or you cannot revoke it", 404);
  return {
    success: true,
    message: "Access revoked",
    data: null,
    statusCode: 200,
  };
};
