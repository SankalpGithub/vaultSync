import { otpRepository } from "../../repository/otp.repository.js";
import type { ResponseData } from "../../types/reqRes.js";
import type { IverifyOtp } from "../../types/auth.js";
import { compareHash, createHash } from "../../utils/hash.js";
import { UserRepository } from "../../repository/user.repository.js";
import jwt from "jsonwebtoken";
import { env } from "../../configs/env.config.js";
import { sessionRepository } from "../../repository/session.repository.js";
import type { Isession } from "../../types/models/Isession.js";

export const handleVerifyOtp = async (bodyObject: any) => {
  const { email, otp, ip, userAgent } = bodyObject;

  const otpDoc = await otpRepository.findOtp(email);
  if (!otpDoc) {
    const res: ResponseData = {
      success: false,
      message: "User otp not found",
      data: null,
      statusCode: 404,
    };
    return res;
  }

  const userId = otpDoc.userId;

  if (otpDoc.expiresAt < new Date()) {
    const res: ResponseData = {
      success: false,
      message: "OTP Expired",
      data: null,
      statusCode: 404,
    };
    return res;
  }

  const isValidOtp = await compareHash(otp, otpDoc?.otpHash);

  if (!isValidOtp) {
    const res: ResponseData = {
      success: false,
      message: "Invalid OTP",
      data: null,
      statusCode: 404,
    };
    return res;
  }

  await UserRepository.updateUserEmailverifyStatus(userId.toString(), true);

  await otpRepository.deleteOtp(otpDoc.id);

  const refreshToken = jwt.sign({ id: otpDoc.userId }, env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const refreshTokenHash = await createHash(refreshToken);

  const session: Isession = {
    userId: otpDoc.userId,
    refreshHash: refreshTokenHash,
    ip,
    userAgent,
    revoke: false,
  };
  //create sessoin
  await sessionRepository.createSession(session);

  const accessToken = jwt.sign({ id: otpDoc.userId }, env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const res: ResponseData = {
    success: true,
    message: "OTP verify successfully",
    data: { accessToken, refreshToken },
    statusCode: 200,
  };
  return res;
};
