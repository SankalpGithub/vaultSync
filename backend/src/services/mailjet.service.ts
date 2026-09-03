import Mailjet, { type SendEmailV3_1 } from "node-mailjet";
import { env } from "../configs/env.config.js";
import { AppError } from "../utils/appError.js";
import { logger } from "../utils/logger.js";

const mailjet = new Mailjet.Client({
  apiKey: env.MJ_APIKEY_PUBLIC,
  apiSecret: env.MJ_APIKEY_PRIVATE,
});

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string,
) => {
  try {
    const body: SendEmailV3_1.Body = {
      Messages: [
        {
          From: {
            Email: env.GOOGLE_USER,
            Name: "Secret Management",
          },
          To: [{ Email: to }],
          Subject: subject,
          TextPart: text,
          HTMLPart: html,
        },
      ],
    };
    const result = await mailjet
      .post("send", { version: "v3.1" })
      .request(body);

    logger.info("Email sent via Mailjet", { to, subject });
    return result.body;
  } catch (error) {
    logger.error("Error sending email via Mailjet", { error, to, subject });
    throw new AppError("Error sending email", 500);
  }
};
