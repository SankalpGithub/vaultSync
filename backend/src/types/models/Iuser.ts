import type { Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email: string;
  hashResetPasswordToken?: string;
  passwordResetExpires: Date | null;
  passwordHash: string;
  isEmailVerified?: boolean;
}

export interface IUserCreate {
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  isEmailVerified?: boolean;
}
