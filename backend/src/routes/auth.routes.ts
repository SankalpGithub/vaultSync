import { Router } from "express";
import { asyncHandler } from "../middlewares/asycHandler.middleware.js";
import {
  validateReq,
  ValidationSource,
} from "../middlewares/reqValidator.middleware.js";
import {
  login,
  refreshToken,
  resendOtp,
  signup,
  verifyOtp,
} from "../controllers/auth.controller.js";
import {
  loginValidationSchema,
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
  validateReq(signupValidationSchema, ValidationSource.BODY),
  asyncHandler(signup),
);

/**
 * POST / refresh-token
 * Validates: refresh the access token using refresh token
 */
router.get(
  "/refresh-token",
  // validateReq(verifyOtpValidationSchema, ValidationSource.BODY),
  asyncHandler(refreshToken),
);

/**
 * POST / verify-otp
 * Validates: email, otp
 */
router.post(
  "/verify-otp",
  validateReq(verifyOtpValidationSchema, ValidationSource.BODY),
  asyncHandler(verifyOtp),
);

/**
 * POST / resend-otp
 * Validates: email
 */
router.post(
  "/resend-otp",
  validateReq(resendOtpValidationSchema, ValidationSource.BODY),
  asyncHandler(resendOtp),
);

/**
 * POST / login
 * Validates: email, password
 */
router.post(
  "/login",
  validateReq(loginValidationSchema, ValidationSource.BODY),
  asyncHandler(login),
);

//logout

//logout from all

//reset password

export default router;
