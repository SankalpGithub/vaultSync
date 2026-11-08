import { User } from "../models/user.models.js";
import type { IUserCreate } from "../types/models/Iuser.js";
import { Types } from "mongoose";

const findUser = async (
  query: Partial<{
    email: string;
    username: string;
    hashResetPasswordToken: string;
  }>,
) => {
  return await User.findOne(query);
};

const createUser = async (user: IUserCreate) => {
  return await User.create(user);
};

const findUsersByIds = async (userIds: string[]) => {
  return await User.find({
    _id: { $in: userIds.map((userId) => new Types.ObjectId(userId)) },
  }).select("_id email name");
};

const findUsersByEmails = async (emails: string[]) => {
  return await User.find({
    email: {
      $in: emails.map(
        (email) =>
          new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      ),
    },
  }).select("_id email name");
};

const updateUserEmailverifyStatus = async (userId: string, status: boolean) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        isEmailVerified: status,
      },
    },
    { new: true },
  );
};

const updateResetPasswordField = async (
  userId: string | undefined,
  hashResetPasswordToken: string | null,
  passwordResetExpires: Date | null,
) => {
  return await User.findByIdAndUpdate(userId, {
    $set: {
      hashResetPasswordToken,
      passwordResetExpires,
    },
  });
};

const updatePassword = async (userId: string | undefined, password: string) => {
  return await User.findByIdAndUpdate(userId, {
    $set: {
      passwordHash: password,
    },
  });
};

export const UserRepository = {
  findUser,
  createUser,
  findUsersByIds,
  findUsersByEmails,
  updateUserEmailverifyStatus,
  updateResetPasswordField,
  updatePassword,
};
