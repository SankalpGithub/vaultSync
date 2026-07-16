// import { Client, SendEmailV3_1, type LibraryResponse } from "node-mailjet";
// import { otpEmailTemplate } from "../templates/otp.template.js";
// import { AppError } from "../utils/appError.js";
// import { env } from "../configs/env.config.js";

// const mailjet_api_key = env.MAILJET_API_KEY;
// const mailjet_secret_key = env.MAILJET_SECRET_KEY;
// const admin_email = env.ADMIN_EMAIL;

// const mailjet = new Client({
//   apiKey: mailjet_api_key,
//   apiSecret: mailjet_secret_key,
// });

// export const sendEmail = async (otp: string, email: string, name: string) => {
//   try {
//     const subject = "Please confirm your email";

//     const html = otpEmailTemplate.replace("{{OTP}}", otp);

//     const request: LibraryResponse<SendEmailV3_1.Response> = await mailjet
//       .post("send", { version: "v3.1" })
//       .request({
//         Messages: [
//           {
//             From: {
//               Email: admin_email,
//               Name: "VultSync",
//             },
//             To: [
//               {
//                 Email: email,
//                 name,
//               },
//             ],
//             Subject: subject,
//             HTMLPart: html,
//           },
//         ],
//       });
//     return request;
//   } catch (error: any) {
//     const statusCode = error?.response?.status || 500;
//     const apiMessage =
//       error?.response?.data?.message ||
//       error?.response?.data?.error ||
//       error?.message ||
//       "Failed to send email due to SMTP or server error.";

//     throw new AppError(`Email sending failed: ${apiMessage}`, statusCode);
//   }
// };
