import { Types } from "mongoose";
import { env } from "../../configs/env.config.js";
import { SendShareInvitationRepository } from "../../repository/sendShareInvitation.repository.js";
import { UserRepository } from "../../repository/user.repository.js";
import type { ResponseData } from "../../types/reqRes.js";
import { AppError } from "../../utils/appError.js";
import { sendEmail } from "../mailjet.service.js";
import { SendShareInvitation } from "../../models/sendShareInvitation.model.js";
import { AccessGrant } from "../../models/accessGrant.model.js";
import { Org } from "../../models/organization.model.js";
import { Project } from "../../models/project.model.js";
import { Secret } from "../../models/secret.model.js";
import { randomBytes } from "node:crypto";
import { createHash } from "node:crypto";
import { isBuiltInRbacRole, isRbacPermission } from "../../authz/rbac.js";

export interface ISendShareInvitationRequest {
  sharerId: string;
  recipientEmails: string[];
  orgId: string;
  orgPermissions: string[];
  projectId: string[];
  projectPermissions: string[];
  environment: Array<{
    envId: string;
    permissions: string[];
  }>;
  secretId: string[];
  secretPermission: string[];
  role: string;
  message?: string;
  expiresAt?: string;
}

export const sendShareInvitation = async (
  body: ISendShareInvitationRequest,
): Promise<ResponseData> => {
  if (!isBuiltInRbacRole(body.role)) throw new AppError("Unknown role", 400);
  const requestedPermissions = [
    ...body.orgPermissions,
    ...body.projectPermissions,
    ...body.environment.flatMap((item) => item.permissions),
    ...body.secretPermission,
  ];
  if (requestedPermissions.some((permission) => !isRbacPermission(permission))) {
    throw new AppError("One or more permissions are invalid", 400);
  }
  const ownedOrganization = await Org.findOne({
    _id: new Types.ObjectId(body.orgId),
    ownerId: new Types.ObjectId(body.sharerId),
    isDeleted: false,
  });
  if (!ownedOrganization) throw new AppError("Organization not found", 404);
  if (body.projectId.length) {
    const projectCount = await Project.countDocuments({
      _id: { $in: body.projectId.map((id) => new Types.ObjectId(id)) },
      orgId: new Types.ObjectId(body.orgId),
      ownerId: new Types.ObjectId(body.sharerId),
      isDeleted: false,
    });
    if (projectCount !== body.projectId.length) throw new AppError("One or more projects are invalid", 400);
  }
  const emails = [...new Set(body.recipientEmails.map((email) => email.trim().toLowerCase()))];
  const recipients = await UserRepository.findUsersByEmails(emails);
  if (recipients.length !== emails.length) {
    throw new AppError("One or more recipients do not exist", 404);
  }

  const frontendUrl = env.FRONTEND_URL.replace(/\/$/, "");
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  const invitationIds: string[] = [];

  for (const recipient of recipients) {
    const token = randomBytes(32).toString("hex");
    const invitation = await SendShareInvitationRepository.createSendShareInvitation({
      sharerId: new Types.ObjectId(body.sharerId),
      recipientEmails: [recipient.email],
      recipientId: new Types.ObjectId(recipient._id),
      recipientEmail: recipient.email,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      status: "pending",
      orgId: new Types.ObjectId(body.orgId),
      orgPermissions: body.orgPermissions,
      projectId: body.projectId.map((projectId) => new Types.ObjectId(projectId)),
      projectPermissions: body.projectPermissions,
      environment: body.environment.map(({ envId, permissions }) => ({ envId: new Types.ObjectId(envId), permissions })),
      secretId: body.secretId.map((secretId) => new Types.ObjectId(secretId)),
      secretPermission: body.secretPermission,
      role: body.role,
      message: body.message ?? "",
      expiresAt,
    } as never);
    invitationIds.push(invitation.id);
    const acceptUrl = `${frontendUrl}/share/accept/${invitation.id}?token=${token}`;
    const rejectUrl = `${frontendUrl}/share/reject/${invitation.id}?token=${token}`;
    await sendEmail(
      recipient.email,
      "VaultSync invitation",
      "You have received a VaultSync sharing invitation.",
      `<p>You have received a VaultSync sharing invitation.</p>
       <p><a href="${acceptUrl}">Accept invitation</a></p>
       <p><a href="${rejectUrl}">Reject invitation</a></p>`,
    );
  }

  return {
    success: true,
    message: "Share invitation created and sent",
    data: { invitationIds, recipientCount: recipients.length },
    statusCode: 201,
  };
};

const invitationFilter = (invitationId: string, userId: string) => ({
  _id: new Types.ObjectId(invitationId),
  recipientId: new Types.ObjectId(userId),
  status: "pending" as const,
});

export const getReceivedInvitations = async (userId: string, status?: string): Promise<ResponseData> => ({
  success: true,
  message: "Received invitations fetched successfully",
  data: await SendShareInvitation.find({
    recipientId: new Types.ObjectId(userId),
    ...(status ? { status: status as "pending" | "accepted" | "rejected" | "revoked" | "expired" | "cancelled" } : {}),
  }).sort({ createdAt: -1 }),
  statusCode: 200,
});

export const getSentInvitations = async (userId: string, status?: string): Promise<ResponseData> => ({
  success: true,
  message: "Sent invitations fetched successfully",
  data: await SendShareInvitation.find({
    sharerId: new Types.ObjectId(userId),
    ...(status ? { status: status as "pending" | "accepted" | "rejected" | "revoked" | "expired" | "cancelled" } : {}),
  }).sort({ createdAt: -1 }),
  statusCode: 200,
});

export const acceptShareInvitation = async (
  invitationId: string,
  userId: string,
  token?: string,
): Promise<ResponseData> => {
  const invitation = await SendShareInvitation.findOne(invitationFilter(invitationId, userId));
  if (!invitation) throw new AppError("Invitation not found or already responded to", 404);
  if (token) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const invitationWithHash = await SendShareInvitation.findOne({
      _id: invitation._id,
      tokenHash,
    }).select("+tokenHash");
    if (!invitationWithHash) throw new AppError("Invalid invitation token", 403);
  }
  if (invitation.expiresAt && invitation.expiresAt <= new Date()) {
    await SendShareInvitation.updateOne({ _id: invitation._id }, { $set: { status: "expired" } });
    throw new AppError("Invitation has expired", 410);
  }
  const firstProjectId = invitation.projectId[0];
  const project = firstProjectId
    ? await Project.findOne({ _id: firstProjectId, orgId: invitation.orgId, isDeleted: false })
    : null;
  const targets: Array<{ resourceType: "organization" | "project" | "environment" | "secret"; resourceId: Types.ObjectId; projectId?: Types.ObjectId; permissions: string[] }> = [
    { resourceType: "organization", resourceId: invitation.orgId, permissions: invitation.orgPermissions },
    ...invitation.projectId.map((id) => ({ resourceType: "project" as const, resourceId: id, permissions: invitation.projectPermissions })),
    ...invitation.environment.map((item) => ({
      resourceType: "environment" as const,
      resourceId: item.envId,
      ...(project ? { projectId: project._id } : {}),
      permissions: item.permissions,
    })),
    ...invitation.secretId.map((id) => ({ resourceType: "secret" as const, resourceId: id, permissions: invitation.secretPermission })),
  ];
  await SendShareInvitation.updateOne({ _id: invitation._id, status: "pending" }, { $set: { status: "accepted", respondedAt: new Date() } });
  await AccessGrant.insertMany(targets.map((target) => ({
    invitationId: invitation._id,
    userId: invitation.recipientId,
    grantedBy: invitation.sharerId,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    ...target,
  })), { ordered: false });
  return { success: true, message: "Invitation accepted", data: { invitationId: invitation._id.toString() }, statusCode: 200 };
};

export const rejectShareInvitation = async (invitationId: string, userId: string): Promise<ResponseData> => {
  const invitation = await SendShareInvitation.findOneAndUpdate(invitationFilter(invitationId, userId), { $set: { status: "rejected", respondedAt: new Date() } }, { new: true });
  if (!invitation) throw new AppError("Invitation not found or already responded to", 404);
  return { success: true, message: "Invitation rejected", data: { invitationId: invitation._id.toString() }, statusCode: 200 };
};

export const cancelShareInvitation = async (invitationId: string, userId: string): Promise<ResponseData> => {
  const invitation = await SendShareInvitation.findOneAndUpdate({ _id: new Types.ObjectId(invitationId), sharerId: new Types.ObjectId(userId), status: "pending" }, { $set: { status: "cancelled", respondedAt: new Date() } }, { new: true });
  if (!invitation) throw new AppError("Pending invitation not found", 404);
  return { success: true, message: "Invitation cancelled", data: { invitationId: invitation._id.toString() }, statusCode: 200 };
};

export const listGrants = async (userId: string, resourceType?: string, resourceId?: string): Promise<ResponseData> => ({
  success: true,
  message: "Access grants fetched successfully",
  data: await AccessGrant.find({
    $or: [{ userId: new Types.ObjectId(userId) }, { grantedBy: new Types.ObjectId(userId) }],
    ...(resourceType ? { resourceType: resourceType as "organization" | "project" | "environment" | "secret" } : {}),
    ...(resourceId && { resourceId: new Types.ObjectId(resourceId) }),
  }).sort({ createdAt: -1 }),
  statusCode: 200,
});

export const updateShareGrant = async (grantId: string, userId: string, body: { role?: string; permissions?: string[]; expiresAt?: string | null }): Promise<ResponseData> => {
  const grant = await AccessGrant.findOneAndUpdate(
    { _id: new Types.ObjectId(grantId), grantedBy: new Types.ObjectId(userId), status: "active" },
    { $set: { ...(body.role && { role: body.role }), ...(body.permissions && { permissions: body.permissions }), ...(body.expiresAt !== undefined && { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }) } },
    { new: true },
  );
  if (!grant) throw new AppError("Grant not found or you cannot manage it", 404);
  return { success: true, message: "Access grant updated", data: grant, statusCode: 200 };
};

export const revokeShareGrant = async (grantId: string, userId: string): Promise<ResponseData> => {
  const grants = await AccessGrant.updateMany(
    { $or: [{ _id: new Types.ObjectId(grantId), grantedBy: new Types.ObjectId(userId) }, { invitationId: new Types.ObjectId(grantId), grantedBy: new Types.ObjectId(userId) }] },
    { $set: { status: "revoked", revokedAt: new Date(), revokedBy: new Types.ObjectId(userId) } },
  );
  if (!grants.modifiedCount) throw new AppError("Grant not found or you cannot revoke it", 404);
  return { success: true, message: "Access revoked", data: null, statusCode: 200 };
};
