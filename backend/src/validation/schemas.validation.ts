import { z } from "zod";

/**
 * Common/Reusable validation schemas for general use across endpoints
 */

// ============= Common Field Validators =============

export const emailValidator = z
  .string("Email must be a string")
  .trim()
  .email("Invalid email format");

export const passwordValidator = z
  .string("Password must be a string")
  .min(8, "Password must be at least 8 characters long");

export const nameValidator = z
  .string("Name must be a string")
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must not exceed 100 characters");

export const usernameValidator = z
  .string("Username must be a string")
  .min(3, "Username must be at least 3 characters")
  .max(50, "Username must not exceed 50 characters")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, hyphens, and underscores",
  );

export const uuidValidator = z
  .string("ID must be a string")
  .uuid("Invalid UUID format");

export const slugValidator = z
  .string("Slug must be a string")
  .regex(
    /^[a-z0-9-]+$/,
    "Slug can only contain lowercase letters, numbers, and hyphens",
  );

export const tokenValidator = z
  .string("Token must be a string")
  .min(10, "Invalid token format");

export const otpValidator = z
  .string("OTP must be a string")
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d+$/, "OTP must contain only digits");

// ============= Common Pagination Validators =============

export const paginationValidator = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(
      z
        .number()
        .int("Page must be an integer")
        .positive("Page must be positive"),
    ),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int("Limit must be an integer").min(1).max(100)),
});

// ============= Common Response Validators =============

export const successResponseValidator = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  statusCode: z.number().optional(),
});

export const errorResponseValidator = z.object({
  success: z.boolean().default(false),
  message: z.string(),
  statusCode: z.number().optional(),
  validationErrors: z.array(z.any()).optional(),
});
