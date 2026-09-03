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

/**
 * POST/ sign-up for register user
 * Validates: email, password, name, username
 */
router.post(
  "/sign-up",
  validateReq(signupValidationSchema),
  asyncHandler(signup),
);

/**
 * POST / refresh-token
 * Validates: refresh the access token using refresh token
 */
router.get("/refresh-token", asyncHandler(refreshToken));

/**
 * POST / verify-otp
 * Validates: email, otp
 */
router.post(
  "/verify-otp",
  validateReq(verifyOtpValidationSchema),
  asyncHandler(verifyOtp),
);

/**
 * POST / resend-otp
 * Validates: email
 */
router.post(
  "/resend-otp",
  validateReq(resendOtpValidationSchema),
  asyncHandler(resendOtp),
);

/**
 * POST / login
 * Validates: email, password
 */
router.post("/login", validateReq(loginValidationSchema), asyncHandler(login));

/**
 * POST / logout
 * Validates: refresh token
 */
router.get(
  "/logout",
  validateReq(refreshTokenValidationSchema),
  asyncHandler(logout),
);

//logout from all
router.get(
  "/logout-all",
  // validateReq(loginValidationSchema),
  asyncHandler(logoutAll),
);

//forgot password
router.post(
  "/forgot-password",
  validateReq(forgotPasswordSchema),
  asyncHandler(forgotPassword),
);

//reset password
router.post(
  "/reset-password",
  validateReq(resetPasswordSchema),
  asyncHandler(resetPassword),
);

export default router;
