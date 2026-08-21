/**
 * Example usage of the reqValidator middleware with Zod
 *
 * This file demonstrates how to create validation schemas
 * and use them with the validate middleware across different endpoints
 */

import { z } from "zod";
import {
  emailValidator,
  passwordValidator,
  nameValidator,
  usernameValidator,
  otpValidator,
} from "./schemas.validation.js";
import { createRequestSchema } from "./requestSchema.js";

// ============= Authentication Schemas =============

/**
 * Signup endpoint validation
 * Validates: body
 */

export const signupValidationObject = z
  .object({
    name: nameValidator,
    username: usernameValidator,
    email: emailValidator,
    password: passwordValidator,
  })
  .strict();

export const signupValidationSchema = createRequestSchema({
  body: signupValidationObject,
});

/**
 * Verify OTP endpoint validation
 * Validates: body
 */
export const verifyOtpValidationObject = z
  .object({
    email: emailValidator,
    otp: otpValidator,
  })
  .strict();
export const verifyOtpValidationSchema = createRequestSchema({
  body: verifyOtpValidationObject,
});

/**
 * Resend OTP endpoint validation
 * Validates: body
 */
export const resendOtpValidationObject = z
  .object({
    email: emailValidator,
  })
  .strict();
export const resendOtpValidationSchema = createRequestSchema({
  body: resendOtpValidationObject,
});

/**
 * Login endpoint validation
 * Validates: body
 */
export const loginValidationObject = z
  .object({
    email: emailValidator,
    password: z.string("Password is required"),
  })
  .strict();
export const loginValidationSchema = createRequestSchema({
  body: loginValidationObject,
});

/**
 * refresh token endpoint
 * Validates: cookie
 */
export const refreshTokenValidationObject = z.object({
  refreshToken: z.string("Refresh token in cookie is required"),
});
export const refreshTokenValidationSchema = createRequestSchema({
  cookies: refreshTokenValidationObject,
});

/**
 * forgot password validation
 * Validates: body
 */
export const forgotPasswordValidationObject = z
  .object({
    email: emailValidator,
  })
  .strict();
export const forgotPasswordSchema = createRequestSchema({
  body: forgotPasswordValidationObject,
});

/**
 * forgot password validation
 * Validates: body
 */
export const resetPasswordValidationObject = z
  .object({
    token: z.string("Token Required"),
    newPassword: z.string("New password Required"),
  })
  .strict();
export const resetPasswordSchema = createRequestSchema({
  body: resetPasswordValidationObject,
});
