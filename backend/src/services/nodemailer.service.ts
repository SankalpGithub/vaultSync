import nodemailer from "nodemailer";
import { otpEmailTemplate } from "../templates/otp.template.js";
import { AppError } from "../utils/appError.js";
import { env } from "../configs/env.config.js";
import { logger } from "../utils/logger.js";

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: env.GOOGLE_USER,
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    refreshToken: env.GOOGLE_REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    throw new AppError(`Error connecting to email server: ${error}`, 500);
  } else {
    logger.info("Email server is ready to send messages");
  }
});

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string,
) => {
  try {
    const info = await transporter.sendMail({
      from: `"Your Name" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    logger.info("Message sent: %s", info.messageId);
    logger.info("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    throw new AppError("Error sending email:", 500);
  }
};
