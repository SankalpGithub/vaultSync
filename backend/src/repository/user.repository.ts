import { User } from "../models/user.models.js";
import type { IUser } from "../types/models/Iuser.js";

const findUser = async (email: string, username: string) => {
  return await User.findOne({
    $or: [{ email }, { username }],
  });
};

const findUserByEmail = async (email: string) => {
  return await User.findOne({ email });
};

const createUser = async (user: IUser) => {
  return await User.create(user);
};

const updateUserEmailverifyStatus = async (userId: string, status: boolean) => {
  return await User.findByIdAndUpdate(userId, {
    $set: {
      isEmailVerified: status,
    },
  });
};
export const UserRepository = {
  findUser,
  createUser,
  updateUserEmailverifyStatus,
  findUserByEmail,
};
