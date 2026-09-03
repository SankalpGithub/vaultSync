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
  objectIdValidator,
  descriptionValidator,
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

// ============= Organization Schemas =============

/**
 * Create organization endpoint validation
 * Validates: body (name, description, visibility)
 * Note: ownerId is taken from authenticated request (req.userId)
 */
export const createOrgValidationObject = z
  .object({
    name: nameValidator,
    description: descriptionValidator,
    visibility: z.enum(["private", "internal"]).default("private").optional(),
  })
  .strict();

export const createOrgValidationSchema = createRequestSchema({
  body: createOrgValidationObject,
});

// ============= Project Schemas =============

/**
 * Create project endpoint validation
 * Validates: body (name, orgId, description, visibility)
 * Note: ownerId is taken from authenticated request (req.userId)
 */
export const createProjectValidationObject = z
  .object({
    name: nameValidator,
    orgId: objectIdValidator,
    description: descriptionValidator,
    visibility: z.enum(["private", "internal"]).default("private").optional(),
  })
  .strict();

export const createProjectValidationSchema = createRequestSchema({
  body: createProjectValidationObject,
});
