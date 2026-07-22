import { UserRepository } from "../../repository/user.repository.js";
import type { Iregister } from "../../types/auth.js";
import type { ResponseData } from "../../types/reqRes.js";
import { createHash } from "../../utils/hash.js";
import { otpRepository } from "../../repository/otp.repository.js";
import { otpEmailTemplate } from "../../templates/otp.template.js";
import { logger } from "../../utils/logger.js";

export const register = async (body: Iregister) => {
  //verify user exist
  const { name, username, email, password } = body;
  const isUserExist = await UserRepository.findUser(email, username);

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
  // const otp: string = generateOtp();
  const otp: string = "123456";
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
  // const result = await sendEmail(
  //   email,
  //   subject,
  //   `Your OTP code is ${otp}`,
  //   html,
  // );

  //response
  const res: ResponseData = {
    success: true,
    message: "Verification Email Send Successfully",
    data: null,
    statusCode: 201,
  };

  return res;
};
