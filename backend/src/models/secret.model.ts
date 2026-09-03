import { model, Schema } from "mongoose";
import type { ISecret } from "../types/models/Isecret.js";

const secretSchema = new Schema<ISecret>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Projects",
      required: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    encryptedValue: {
      type: String,
      required: true,
      select: false,
    },
    environment: {
      type: String,
      enum: ["development", "staging", "production"],
      default: "development",
      required: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
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

secretSchema.index({ projectId: 1, environment: 1, key: 1 }, { unique: true });
secretSchema.index({ projectId: 1, isDeleted: 1 });

export const Secret = model<ISecret>("Secrets", secretSchema);
