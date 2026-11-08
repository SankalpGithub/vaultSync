import { model, Schema, Types } from "mongoose";
import type { IOrgCollaborator } from "../types/models/IorgCollaborator.js";

const orgCollaboratorSchema = new Schema<IOrgCollaborator>(
  {
    orgId: {
      type: Types.ObjectId,
      ref: "Organizations",
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
    role: {
      type: String,
      required: true,
      trim: true,
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
    invitationStatus: {
      type: String,
      enum: ["pending", "accept", "reject"],
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

orgCollaboratorSchema.index({ orgId: 1, recipientId: 1 });
orgCollaboratorSchema.index({ sharerId: 1, recipientId: 1 });
orgCollaboratorSchema.index({ status: 1, invitationStatus: 1 });

export const OrgCollaborator = model<IOrgCollaborator>(
  "OrgCollaborators",
  orgCollaboratorSchema,
);
