import { otpRepository } from "../../repository/otp.repository.js";
import { otpEmailTemplate } from "../../templates/otp.template.js";
import type { ResponseData } from "../../types/reqRes.js";
import { createHash } from "../../utils/hash.js";
import { sendEmail } from "../nodemailer.service.js";

export const handleResendOtp = async (email: string) => {
  const otpDoc = await otpRepository.findOtp(email);

  if (!otpDoc) {
    const res: ResponseData = {
      success: false,
      message: "OTP Regestration not found",
      data: null,
      statusCode: 404,
    };
    return res;
  }

  // const otp: string = generateOtp();
  const otp: string = "789012";
  const otpHash: string = await createHash(otp);

  await otpRepository.updateOtp(
    otpDoc.id,
    otpHash,
    new Date(Date.now() + 10 * 60 * 1000),
  );

  const subject = "OTP verifcation for vaultSync application";
  const html = otpEmailTemplate.replace("{{OTP}}", otp);

  const result = await sendEmail(
    email,
    subject,
    `Your OTP code is ${otp}`,
    html,
  );

  const res: ResponseData = {
    success: true,
    message: "Otp resend successfully",
    data: result,
    statusCode: 200,
  };

  return res;
};
