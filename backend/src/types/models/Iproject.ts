import type { Types } from "mongoose";

export interface IProject {
  _id: Types.ObjectId;
  name: string;
  description?: string; // Project description/purpose
  ownerId: Types.ObjectId; // Creator/owner reference
  orgId: Types.ObjectId; // Organization reference
  status: "active" | "archived"; // Project status
  members?: Types.ObjectId[]; // Array of user IDs with access
  visibility: "private" | "internal"; // Visibility level
  lastModifiedBy?: Types.ObjectId; // Track who last modified
  isDeleted: boolean; // Soft delete flag
  deletedAt?: Date; // When deleted
  createdAt: Date; // Auto-generated timestamp
  updatedAt: Date; // Auto-generated timestamp
}

export interface ICreateProject {
  name: string;
  description?: string;
  ownerId: Types.ObjectId;
  orgId: Types.ObjectId;
  visibility?: "private" | "internal";
}
