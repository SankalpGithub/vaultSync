import { UserRepository } from "../../repository/user.repository.js";
import type { Iregister } from "../../types/auth.js";
import type { ResponseData } from "../../types/reqRes.js";
import { createHash } from "../../utils/hash.js";
import { otpRepository } from "../../repository/otp.repository.js";
import { otpEmailTemplate } from "../../templates/otp.template.js";
import { logger } from "../../utils/logger.js";
import { compareHash, hashToken } from "../../utils/hash.js";
import jwt from "jsonwebtoken";
import { env } from "../../configs/env.config.js";
import { sessionRepository } from "../../repository/session.repository.js";
import type { Isession } from "../../types/models/Isession.js";
import type { ItokenPayload } from "../../types/tokenPayload.js";
import { sendEmail } from "../mailjet.service.js";
import { generateOtp } from "../../utils/generateOtp.js";

export const register = async (body: Iregister) => {
  //verify user exist
  const { name, username, email, password } = body;
  const isUserExist = await UserRepository.findUser({
    email,
    username,
  });

  if (isUserExist) {
    logger.error("User Alerady Exist", {
      statuscode: 409,
      existingtUserId: isUserExist.id,
    });
    const res: ResponseData = {
      success: false,
      message: "User Already Exist",
      data: null,
      statusCode: 409,
    };
    return res;
  }

  //user
  const passwordHash: string = await createHash(password);
  const user = await UserRepository.createUser({
    name,
    username,
    email,
    passwordHash,
  });

  //otp
  const otp: string = generateOtp();
  const otpHash: string = await createHash(otp);
  await otpRepository.insertOtp({
    userId: user._id,
    email,
    otpHash,
    purpose: "email_verification",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  //email
  const subject = "OTP verifcation for vaultSync application";
  const html = otpEmailTemplate.replace("{{OTP}}", otp);
  const result = await sendEmail(
    email,
    subject,
    `Your OTP code is ${otp}`,
    html,
  );

  //response
  const res: ResponseData = {
    success: true,
    message: "Verification Email Send Successfully",
    data: null,
    statusCode: 201,
  };

  return res;
};

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
