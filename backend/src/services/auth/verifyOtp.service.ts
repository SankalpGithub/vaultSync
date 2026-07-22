import { otpRepository } from "../../repository/otp.repository.js";
import type { ResponseData } from "../../types/reqRes.js";
import type { IverifyOtp } from "../../types/auth.js";
import { compareHash, hashToken } from "../../utils/hash.js";
import { UserRepository } from "../../repository/user.repository.js";
import jwt from "jsonwebtoken";
import { env } from "../../configs/env.config.js";
import { sessionRepository } from "../../repository/session.repository.js";
import type { Isession } from "../../types/models/Isession.js";
import type { ItokenPayload } from "../../types/tokenPayload.js";

export const handleVerifyOtp = async (bodyObject: any) => {
  const { email, otp, ip, userAgent } = bodyObject;

  //find otp document from provided email
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

  //get user
  const userId = otpDoc.userId;

  //check is otp expiry
  if (otpDoc.expiresAt < new Date()) {
    const res: ResponseData = {
      success: false,
      message: "OTP Expired",
      data: null,
      statusCode: 404,
    };
    return res;
  }

  //validate otp
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

  //update user isEmailVerifyStatus to true
  await UserRepository.updateUserEmailverifyStatus(userId.toString(), true);

  //delet otp
  await otpRepository.deleteOtp(otpDoc.id);

  //create session
  const sessionObject: Isession = {
    userId: otpDoc.userId,
    refreshTokenHash: "",
    ip,
    userAgent,
    revoke: false,
  };

  const session = await sessionRepository.createSession(sessionObject);

  //create refresh token
  const refreshTokenPayload: ItokenPayload = {
    userId: otpDoc.userId.toString(),
    sessionId: session.id,
    type: "refresh",
  };

  const refreshToken = jwt.sign(refreshTokenPayload, env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const refreshTokenHash = hashToken(refreshToken);

  //update session with refresh token
  const updatedSession = await sessionRepository.updateSession(session.id, {
    refreshTokenHash,
  });

  //create access token
  const accessTokenPayload: ItokenPayload = {
    userId: otpDoc.userId.toString(),
    sessionId: session.id,
    type: "access",
  };

  const accessToken = jwt.sign(accessTokenPayload, env.JWT_SECRET, {
    expiresIn: "15m",
  });

  //send response
  const res: ResponseData = {
    success: true,
    message: "OTP verify successfully",
    data: { accessToken, refreshToken },
    statusCode: 200,
  };
  return res;
};
