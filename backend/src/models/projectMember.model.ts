import { model, Schema, Types } from "mongoose";
import type { IProjectMember } from "../types/models/IprojectMember.js";

const projectMemberEnvironmentSchema = new Schema(
  {
    envId: {
      type: Types.ObjectId,
      required: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const projectMemberSchema = new Schema<IProjectMember>(
  {
    projectId: {
      type: Types.ObjectId,
      ref: "Projects",
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
    environment: {
      type: [projectMemberEnvironmentSchema],
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

projectMemberSchema.index({ projectId: 1, recipientId: 1 });
projectMemberSchema.index({ sharerId: 1, recipientId: 1 });
projectMemberSchema.index({ status: 1 });

export const ProjectMember = model<IProjectMember>(
  "ProjectMembers",
  projectMemberSchema,
);
