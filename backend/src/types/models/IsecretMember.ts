import type { Types } from "mongoose";

export type SecretMemberStatus = "pending" | "active" | "revoked";

export interface ISecretMember {
  _id: Types.ObjectId;
  secretId: Types.ObjectId;
  sharerId: Types.ObjectId;
  recipientId: Types.ObjectId;
  permissions: string[];
  status: SecretMemberStatus;
  invitedAt: Date;
  acceptedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateSecretMember {
  secretId: Types.ObjectId;
  sharerId: Types.ObjectId;
  recipientId: Types.ObjectId;
  permissions?: string[];
  status?: SecretMemberStatus;
  invitedAt?: Date;
  acceptedAt?: Date | null;
  expiresAt?: Date | null;
}
