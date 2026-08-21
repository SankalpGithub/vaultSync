import { model, Schema, Types } from "mongoose";
import type { IOrgs } from "../types/models/Iorganization.js";

const orgSchema = new Schema<IOrgs>(
  {
    name: {
      type: String,
      required: true,
    },
    ownerId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Org = model<IOrgs>("Organizations", orgSchema);
