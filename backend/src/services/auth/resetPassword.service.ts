import { createHash, hashToken } from "../../utils/hash.js";
import { UserRepository } from "../../repository/user.repository.js";
import type { ResponseData } from "../../types/reqRes.js";
import { logger } from "../../utils/logger.js";
import crypto from "crypto";
import { env } from "../../configs/env.config.js";
import fs from "fs";
import path from "path";
import { sendEmail } from "../mailjet.service.js";
import type { IUser } from "../../types/models/Iuser.js";
import { sessionRepository } from "../../repository/session.repository.js";

export const handleForgotPassword = async (email: string) => {
  //verify user exist
  const user = await UserRepository.findUser({ email });

  if (!user) {
    logger.error("User not found plz sign up", {
      statuscode: 404,
    });
    const res: ResponseData = {
      success: false,
      message: "User not found plz sign up",
      data: null,
      statusCode: 404,
    };
    return res;
  }

  //generate token
  const resetPasswordToken = crypto.randomBytes(32).toString("hex");

  //create hash of token and save to db
  const hashResetPasswordToken = hashToken(resetPasswordToken);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await UserRepository.updateResetPasswordField(
    user.id,
    hashResetPasswordToken,
    expiresAt,
  );

  const resetPasswordLink = `${env.FRONTEND_URL}/auth/reset-password?token=${resetPasswordToken}`;
  //send reset password page link through email

  const templatePath = path.join(
    process.cwd(),
    "src",
    "templates",
    "resetpassword.template.html",
  );

  const html = fs.readFileSync(templatePath, "utf-8");
  const emailHtml = html.replace(/{{RESET_URL}}/g, resetPasswordLink);

  const subject = "Reset Your Password";
  await sendEmail(email, subject, `Email for Reset password link`, emailHtml);

  //response
  const res: ResponseData = {
    success: true,
    message: "Reset Password Email Send Successfully",
    data: null,
    statusCode: 201,
  };

  return res;
};

export const handleResetPassword = async (token: string, password: string) => {
  //hash token
  const hashResetPasswordToken = hashToken(token);

  console.log(hashResetPasswordToken);
  //find valid hash
  const user: IUser | null = await UserRepository.findUser({
    hashResetPasswordToken,
  });

  if (!user) {
    const res: ResponseData = {
      success: false,
      message: "Invalid Token (reset password user not found)",
      data: null,
      statusCode: 404,
    };

    return res;
  }

  const userId = user._id.toString();

  //check for expiry
  const passwordResetExpires = user.passwordResetExpires;
  if (passwordResetExpires != null && passwordResetExpires < new Date()) {
    const res: ResponseData = {
      success: false,
      message: "Invalid Token (Token Expired)",
      data: null,
      statusCode: 404,
    };

    return res;
  }
  //hash new password
  const HashPassword = await createHash(password);

  //update password
  await UserRepository.updatePassword(userId, HashPassword);

  //set reset password field to null
  await UserRepository.updateResetPasswordField(userId, null, null);

  //invalidate existing sessions
  await sessionRepository.updateUserSessions(userId);

  //response
  const res: ResponseData = {
    success: true,
    message: "Password Reset Successfully",
    data: null,
    statusCode: 201,
  };

  return res;
};
