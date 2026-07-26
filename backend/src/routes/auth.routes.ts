import { Router } from "express";
import { asyncHandler } from "../middlewares/asycHandler.middleware.js";
import {
  validateReq,
  ValidationSource,
} from "../middlewares/reqValidator.middleware.js";
import {
  login,
  logout,
  logoutAll,
  refreshToken,
  resendOtp,
  signup,
  verifyOtp,
} from "../controllers/auth.controller.js";
import {
  loginValidationSchema,
  refreshTokenValidationSchema,
  resendOtpValidationSchema,
  signupValidationSchema,
  verifyOtpValidationSchema,
} from "../validation/examples.validation.js";

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
router.get(
  "/refresh-token",
  // validateReq(refreshTokenValidationSchema),
  asyncHandler(refreshToken),
);

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

//reset password
router.post(
  "/reset-password",
  validateReq(loginValidationSchema),
  asyncHandler(login),
);

export default router;
