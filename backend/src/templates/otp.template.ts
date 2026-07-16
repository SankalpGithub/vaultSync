export const otpEmailTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="background:#2563eb;padding:30px;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;">
                Secret Management
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <h2 style="margin-top:0;color:#333333;">
                Verify Your Email
              </h2>

              <p style="font-size:16px;color:#555555;line-height:1.6;">
                Hello,
              </p>

              <p style="font-size:16px;color:#555555;line-height:1.6;">
                Use the One-Time Password (OTP) below to complete your verification.
              </p>

              <!-- OTP -->
              <table align="center" cellpadding="0" cellspacing="0" style="margin:30px auto;">
                <tr>
                  <td
                    style="
                      background:#f3f4f6;
                      border:2px dashed #2563eb;
                      border-radius:8px;
                      padding:18px 40px;
                      font-size:34px;
                      font-weight:bold;
                      letter-spacing:8px;
                      color:#2563eb;
                      text-align:center;
                    "
                  >
                    {{OTP}}
                  </td>
                </tr>
              </table>

              <p style="font-size:16px;color:#555555;line-height:1.6;">
                This OTP is valid for <strong>10 minutes</strong>.
              </p>

              <p style="font-size:16px;color:#555555;line-height:1.6;">
                If you didn't request this code, you can safely ignore this email.
              </p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:30px 0;">

              <p style="font-size:13px;color:#888888;">
                For your security, never share this OTP with anyone.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              align="center"
              style="background:#f9fafb;padding:20px;color:#888888;font-size:13px;"
            >
              © 2026 Secret Management. All rights reserved.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
