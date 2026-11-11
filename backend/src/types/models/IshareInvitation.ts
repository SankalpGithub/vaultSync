import type { Types } from "mongoose";

export interface IShareEnvironment {
  envId: Types.ObjectId;
  permissions: string[];
}

export interface IShareInvitations {
  _id: Types.ObjectId;
  sharerId: Types.ObjectId;
  recipientId: Types.ObjectId;
  recipientEmail: string;
  tokenHash?: string | null;
  orgId: Types.ObjectId;
  orgPermissions: string[];
  projectId: Types.ObjectId[];
  projectPermissions: string[];
  environment: IShareEnvironment[];
  secretId: Types.ObjectId[];
  secretPermission: string[];
  role: string;
  status?:
    | "pending"
    | "accepted"
    | "rejected"
    | "revoked"
    | "expired"
    | "cancelled";
  respondedAt?: Date | null;
  revokedAt?: Date | null;
  message?: string;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateShareInvitations {
  sharerId: Types.ObjectId;
  recipientId: Types.ObjectId;
  recipientEmail: string;
  tokenHash: string;
  orgId: Types.ObjectId;
  orgPermissions: string[];
  projectId: Types.ObjectId[];
  projectPermissions: string[];
  environment: IShareEnvironment[];
  secretId: Types.ObjectId[];
  secretPermission: string[];
  role: string;
  message?: string;
  expiresAt?: Date | null;
}
