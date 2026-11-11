import { model, Schema, Types } from "mongoose";
import type { IShareInvitations } from "../types/models/IshareInvitation.js";

const shareInvitationsSchema = new Schema<IShareInvitations>(
  {
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
    recipientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
    },
    tokenHash: { type: String, select: false, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "revoked",
        "expired",
        "cancelled",
      ],
      default: "pending",
    },
    respondedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    orgId: {
      type: Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    orgPermissions: { type: [String], default: [] },
    projectId: {
      type: [{ type: Types.ObjectId, ref: "Projects" }],
      default: [],
    },
    projectPermissions: { type: [String], default: [] },
    environment: {
      type: [
        new Schema(
          {
            envId: {
              type: Types.ObjectId,
              ref: "Environments",
              required: true,
            },
            permissions: { type: [String], default: [] },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    secretId: {
      type: [{ type: Types.ObjectId, ref: "Secrets" }],
      default: [],
    },
    secretPermission: { type: [String], default: [] },
    role: {
      type: String,
      required: true,
    },
    message: { type: String, trim: true, default: "" },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const shareInvitations = model<IShareInvitations>(
  "ShareInvitations",
  shareInvitationsSchema,
);
