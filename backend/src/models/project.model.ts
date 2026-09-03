import { model, Schema, Types } from "mongoose";
import type { IProject } from "../types/models/Iproject.js";

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organizations",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    members: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    visibility: {
      type: String,
      enum: ["private", "internal"],
      default: "private",
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
projectSchema.index({ orgId: 1, isDeleted: 1 });
projectSchema.index({ ownerId: 1, isDeleted: 1 });
projectSchema.index({ status: 1, isDeleted: 1 });

export const Project = model<IProject>("Projects", projectSchema);
