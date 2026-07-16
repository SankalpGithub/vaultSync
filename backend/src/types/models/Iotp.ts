import type { Types } from "mongoose";

export interface IOtp {
  userId: Types.ObjectId;
  email: string;
  otpHash: string;
  purpose: "email_verification" | "password_reset";
  expiresAt: Date;
  isUsed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
