import { model, Schema, Types } from "mongoose";

const accessGrantSchema = new Schema(
  {
    invitationId: { type: Types.ObjectId, ref: "ShareInvitations", required: true },
    userId: { type: Types.ObjectId, ref: "User", required: true },
    grantedBy: { type: Types.ObjectId, ref: "User", required: true },
    resourceType: {
      type: String,
      enum: ["organization", "project", "environment", "secret"],
      required: true,
    },
    resourceId: { type: Types.ObjectId, required: true },
    projectId: { type: Types.ObjectId, ref: "Projects", default: null },
    role: { type: String, required: true },
    permissions: { type: [String], default: [] },
    status: { type: String, enum: ["active", "revoked"], default: "active" },
    acceptedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

accessGrantSchema.index(
  { invitationId: 1, userId: 1, resourceType: 1, resourceId: 1 },
  { unique: true },
);
accessGrantSchema.index({ userId: 1, status: 1, resourceType: 1 });
accessGrantSchema.index({ grantedBy: 1, status: 1 });

export const AccessGrant = model("AccessGrants", accessGrantSchema);
