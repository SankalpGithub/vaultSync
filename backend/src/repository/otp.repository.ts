import { otpModel } from "../models/otp.model.js";
import type { IOtp } from "../types/models/Iotp.js";

const insertOtp = async (otpObject: IOtp) => {
  return await otpModel.create(otpObject);
};

const findOtp = async (email: string) => {
  return await otpModel.findOne({ email });
};

const deleteOtp = async (otpId: string) => {
  return await otpModel.findByIdAndDelete(otpId);
};

const updateOtp = async (otpId: string, otpHash: string, expiredsAt: Date) => {
  return await otpModel.findByIdAndUpdate(
    otpId,
    {
      $set: {
        otpHash,
      },
    },
    { new: true },
  );
};

export const otpRepository = {
  findOtp,
  insertOtp,
  deleteOtp,
  updateOtp,
};
