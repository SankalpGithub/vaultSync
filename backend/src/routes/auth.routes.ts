import { Router } from "express";
import { asyncHandler } from "../middlewares/asycHandler.middleware.js";
import {
  validateReq,
  ValidationSource,
} from "../middlewares/reqValidator.middleware.js";
import {
  forgotPassword,
  login,
  logout,
  logoutAll,
  refreshToken,
  resendOtp,
  resetPassword,
  signup,
  verifyOtp,
} from "../controllers/auth.controller.js";
import {
  forgotPasswordSchema,
  loginValidationSchema,
  refreshTokenValidationSchema,
  resendOtpValidationSchema,
  resetPasswordSchema,
  signupValidationSchema,
  verifyOtpValidationSchema,
} from "../validation/routes.validation.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";

const router: Router = Router();

// POST /sign-up
// Description: Register a new user.
// Validation: email, password, name, username
router.post(
  "/sign-up",
  validateReq(signupValidationSchema),
  asyncHandler(signup),
);

// POST /verify-otp
// Description: Verifies the signup OTP and activates the user's account.
// Validation: email, otp
router.post(
  "/verify-otp",
  validateReq(verifyOtpValidationSchema),
  asyncHandler(verifyOtp),
);

// GET /refresh-token
// Description: Generates a new access token and refresh token using a valid refresh token.
// Validation: refresh token
router.get("/refresh-token", asyncHandler(refreshToken));

// POST /resend-otp
// Description: Resends the signup OTP to the user's email address.
// Validation: email
router.post(
  "/resend-otp",
  validateReq(resendOtpValidationSchema),
  asyncHandler(resendOtp),
);

// POST /login
// Description: Authenticates a user and creates an authenticated session.
// Validation: email, password
router.post("/login", validateReq(loginValidationSchema), asyncHandler(login));

// GET /logout
// Description: Logs the user out by invalidating the current refresh token.
// Validation: refresh token
router.get(
  "/logout",
  validateReq(refreshTokenValidationSchema),
  asyncHandler(logout),
);

// GET /logout-all
// Description: Logs the user out of all active sessions.
// Validation: authenticated access token
router.get("/logout-all", asyncHandler(logoutAll));

// POST /forgot-password
// Description: Sends a password-reset OTP or link to the user's email address.
// Validation: email
router.post(
  "/forgot-password",
  validateReq(forgotPasswordSchema),
  asyncHandler(forgotPassword),
);

// POST /reset-password
// Description: Resets the user's password using a valid reset token or OTP.
// Validation: email, OTP or reset token, new password
router.post(
  "/reset-password",
  validateReq(resetPasswordSchema),
  asyncHandler(resetPassword),
);

export default router;
