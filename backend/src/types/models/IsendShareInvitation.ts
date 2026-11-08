import type { Types } from "mongoose";

export interface ISendShareEnvironment {
  envId: Types.ObjectId;
  permissions: string[];
}

export interface ISendShareInvitation {
  _id: Types.ObjectId;
  sharerId: Types.ObjectId;
  recipientEmails: string[];
  orgId: Types.ObjectId;
  orgPermissions: string[];
  projectId: Types.ObjectId[];
  projectPermissions: string[];
  environment: ISendShareEnvironment[];
  secretId: Types.ObjectId[];
  secretPermission: string[];
  role: string;
  recipientId?: Types.ObjectId | null;
  recipientEmail?: string | null;
  tokenHash?: string | null;
  status?: "pending" | "accepted" | "rejected" | "revoked" | "expired" | "cancelled";
  respondedAt?: Date | null;
  revokedAt?: Date | null;
  message?: string;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateSendShareInvitation {
  sharerId: Types.ObjectId;
  recipientEmails: string[];
  orgId: Types.ObjectId;
  orgPermissions: string[];
  projectId: Types.ObjectId[];
  projectPermissions: string[];
  environment: ISendShareEnvironment[];
  secretId: Types.ObjectId[];
  secretPermission: string[];
  role: string;
  recipientId?: Types.ObjectId | null;
  recipientEmail?: string | null;
  tokenHash?: string | null;
  status?: "pending" | "accepted" | "rejected" | "revoked" | "expired" | "cancelled";
  message?: string;
  expiresAt?: Date | null;
}
