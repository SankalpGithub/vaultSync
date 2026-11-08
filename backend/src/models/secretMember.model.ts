import { model, Schema, Types } from "mongoose";
import type { ISecretMember } from "../types/models/IsecretMember.js";

const secretMemberSchema = new Schema<ISecretMember>(
  {
    secretId: {
      type: Types.ObjectId,
      ref: "Secrets",
      required: true,
    },
    sharerId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "active", "revoked"],
      default: "pending",
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

secretMemberSchema.index({ secretId: 1, recipientId: 1 });
secretMemberSchema.index({ sharerId: 1, recipientId: 1 });
secretMemberSchema.index({ status: 1 });

export const SecretMember = model<ISecretMember>(
  "SecretMembers",
  secretMemberSchema,
);
