import { model, Schema, Types } from "mongoose";
import type { IOrgs } from "../types/models/Iorganization.js";

const orgSchema = new Schema<IOrgs>(
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
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: {
      type: [Types.ObjectId],
      ref: "User",
      default: [],
    },
    visibility: {
      type: String,
      enum: ["private", "internal"],
      default: "private",
    },
    lastModifiedBy: {
      type: Types.ObjectId,
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
orgSchema.index({ ownerId: 1, isDeleted: 1 });
orgSchema.index({ visibility: 1, isDeleted: 1 });

export const Org = model<IOrgs>("Organizations", orgSchema);
