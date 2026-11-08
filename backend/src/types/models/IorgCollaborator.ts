import type { Types } from "mongoose";

export type OrgCollaboratorStatus = "pending" | "active" | "revoked";
export type OrgCollaboratorInvitationStatus = "pending" | "accept" | "reject";

export interface IOrgCollaborator {
  _id: Types.ObjectId;
  orgId: Types.ObjectId;
  sharerId: Types.ObjectId;
  recipientId: Types.ObjectId;
  role: string;
  permissions: string[];
  status: OrgCollaboratorStatus;
  invitationStatus: OrgCollaboratorInvitationStatus;
  invitedAt: Date;
  acceptedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrgCollaborator {
  orgId: Types.ObjectId;
  sharerId: Types.ObjectId;
  recipientId: Types.ObjectId;
  role: string;
  permissions: string[];
  status?: OrgCollaboratorStatus;
  invitationStatus?: OrgCollaboratorInvitationStatus;
  invitedAt?: Date;
  acceptedAt?: Date | null;
  expiresAt?: Date | null;
}
