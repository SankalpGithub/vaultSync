import { model, Schema, Types } from "mongoose";
import type { ISendShareInvitation } from "../types/models/IsendShareInvitation.js";

const sendShareEnvironmentSchema = new Schema(
  {
    envId: {
      type: Types.ObjectId,
      ref: "Environments",
      required: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const sendShareInvitationSchema = new Schema<ISendShareInvitation>(
  {
    sharerId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientEmails: {
      type: [String],
      required: true,
      default: [],
    },
    recipientId: { type: Types.ObjectId, ref: "User", default: null },
    recipientEmail: { type: String, trim: true, lowercase: true, default: null },
    tokenHash: { type: String, select: false, default: null },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "revoked", "expired", "cancelled"],
      default: "pending",
    },
    respondedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    orgId: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    orgPermissions: {
      type: [String],
      default: [],
    },
    projectId: {
      type: [{ type: Types.ObjectId, ref: "Projects" }],
      default: [],
    },
    projectPermissions: {
      type: [String],
      default: [],
    },
    environment: {
      type: [sendShareEnvironmentSchema],
      default: [],
    },
    secretId: {
      type: [{ type: Types.ObjectId, ref: "Secrets" }],
      default: [],
    },
    secretPermission: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      required: true,
    },
    message: { type: String, trim: true, default: "" },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const SendShareInvitation = model<ISendShareInvitation>(
  "SendShareInvitations",
  sendShareInvitationSchema,
);
