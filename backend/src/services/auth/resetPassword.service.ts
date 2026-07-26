import { createHash } from "../../utils/hash.js";
import { UserRepository } from "../../repository/user.repository.js";
import type { ResponseData } from "../../types/reqRes.js";
import { logger } from "../../utils/logger.js";
import { otpRepository } from "../../repository/otp.repository.js";
import { otpEmailTemplate } from "../../templates/otp.template.js";

export const handleResetPassword = async (email: string) => {
  //verify user exist
  const user = await UserRepository.findUserByEmail(email);

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

  //otp
  // const otp: string = generateOtp();
  const otp: string = "123456";
  const otpHash: string = await createHash(otp);
  await otpRepository.insertOtp({
    userId: user._id,
    email,
    otpHash,
    purpose: "password_reset",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  //email
  const subject = "OTP verifcation for vaultSync application (reset password)";
  const html = otpEmailTemplate.replace("{{OTP}}", otp);
  // const result = await sendEmail(
  //   email,
  //   subject,
  //   `Your OTP code is ${otp}`,
  //   html,
  // );

  //response
  const res: ResponseData = {
    success: true,
    message: "Reset Password Email Send Successfully",
    data: null,
    statusCode: 201,
  };

  return res;
};

export const verifyResetPasswordOtp = async (otp: string) => {};
