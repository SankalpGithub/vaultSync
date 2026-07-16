import type { Types } from "mongoose";

export interface Isession {
  userId: Types.ObjectId;
  refreshHash: string;
  ip: string;
  userAgent: string;
  revoke: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
