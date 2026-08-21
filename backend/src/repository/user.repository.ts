import { User } from "../models/user.models.js";
import type { IUserCreate } from "../types/models/Iuser.js";

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
  updateUserEmailverifyStatus,
  updateResetPasswordField,
  updatePassword,
};
