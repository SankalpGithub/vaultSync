import { model, Schema } from "mongoose";
import type { Isession } from "../types/models/Isession.js";

const sessionSchema = new Schema<Isession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    refreshHash: {
      type: String,
      required: true,
    },

    ip: {
      type: String,
      required: true,
    },

    userAgent: {
      type: String,
      required: true,
    },

    revoke: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const sessionModel = model<Isession>("sessions", sessionSchema);
