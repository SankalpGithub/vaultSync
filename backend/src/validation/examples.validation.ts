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
  uuidValidator,
  paginationValidator,
  otpValidator,
} from "./schemas.validation.js";

// ============= Authentication Schemas =============

/**
 * Signup endpoint validation
 * Validates: body
 */
export const signupValidationSchema = z.object({
  name: nameValidator,
  username: usernameValidator,
  email: emailValidator,
  password: passwordValidator,
});

// /**
//  * Verify OTP endpoint validation
//  * Validates: body
//  */
export const verifyOtpValidationSchema = z.object({
  email: emailValidator,
  otp: otpValidator,
});

/**
 * Resend OTP endpoint validation
 * Validates: body
 */
export const resendOtpValidationSchema = z.object({
  email: emailValidator,
});

/**
 * Login endpoint validation
 * Validates: body
 */
export const loginValidationSchema = z.object({
  email: emailValidator,
  password: z.string("Password is required"),
});

// // ============= User/Profile Schemas =============

// /**
//  * Update user profile endpoint validation
//  * Validates: body and params
//  */
// export const updateProfileValidationSchema: ValidateSchemas = {
//   params: z.object({
//     userId: uuidValidator,
//   }),
//   body: z.object({
//     name: nameValidator.optional(),
//     username: usernameValidator.optional(),
//   }),
// };

// /**
//  * Get user by ID endpoint validation
//  * Validates: params
//  */
// export const getUserByIdValidationSchema: ValidateSchemas = {
//   params: z.object({
//     userId: uuidValidator,
//   }),
// };

// /**
//  * List users endpoint validation
//  * Validates: query
//  */
// export const listUsersValidationSchema: ValidateSchemas = {
//   query: paginationValidator,
// };

// // ============= Project Schemas =============

// /**
//  * Create project endpoint validation
//  * Validates: body
//  */
// export const createProjectValidationSchema: ValidateSchemas = {
//   body: z.object({
//     name: z.string("Project name is required").min(1).max(100),
//     description: z.string().max(500).optional(),
//     organizationId: uuidValidator,
//   }),
// };

// /**
//  * Update project endpoint validation
//  * Validates: params and body
//  */
// export const updateProjectValidationSchema: ValidateSchemas = {
//   params: z.object({
//     projectId: uuidValidator,
//   }),
//   body: z.object({
//     name: z.string().min(1).max(100).optional(),
//     description: z.string().max(500).optional(),
//   }),
// };

// /**
//  * Delete project endpoint validation
//  * Validates: params
//  */
// export const deleteProjectValidationSchema: ValidateSchemas = {
//   params: z.object({
//     projectId: uuidValidator,
//   }),
// };

// /**
//  * List projects endpoint validation
//  * Validates: query
//  */
// export const listProjectsValidationSchema: ValidateSchemas = {
//   query: paginationValidator,
// };

// // ============= Secret Schemas =============

// /**
//  * Create secret endpoint validation
//  * Validates: body
//  */
// export const createSecretValidationSchema: ValidateSchemas = {
//   body: z.object({
//     key: z
//       .string("Secret key is required")
//       .min(1)
//       .max(255)
//       .regex(
//         /^[A-Z0-9_]+$/,
//         "Secret key must contain only uppercase letters, numbers, and underscores",
//       ),
//     value: z.string("Secret value is required"),
//     projectId: uuidValidator,
//     description: z.string().max(500).optional(),
//   }),
// };

// /**
//  * Update secret endpoint validation
//  * Validates: params and body
//  */
// export const updateSecretValidationSchema: ValidateSchemas = {
//   params: z.object({
//     secretId: uuidValidator,
//   }),
//   body: z.object({
//     value: z.string().optional(),
//     description: z.string().max(500).optional(),
//   }),
// };

// /**
//  * Delete secret endpoint validation
//  * Validates: params
//  */
// export const deleteSecretValidationSchema: ValidateSchemas = {
//   params: z.object({
//     secretId: uuidValidator,
//   }),
// };

// /**
//  * Get secret endpoint validation
//  * Validates: params
//  */
// export const getSecretValidationSchema: ValidateSchemas = {
//   params: z.object({
//     secretId: uuidValidator,
//   }),
// };

// /**
//  * List secrets endpoint validation
//  * Validates: query
//  */
// export const listSecretsValidationSchema: ValidateSchemas = {
//   query: paginationValidator.extend({
//     projectId: uuidValidator.optional(),
//   }),
// };

// // ============= Organization Schemas =============

// /**
//  * Create organization endpoint validation
//  * Validates: body
//  */
// export const createOrganizationValidationSchema: ValidateSchemas = {
//   body: z.object({
//     name: z.string("Organization name is required").min(1).max(100),
//     description: z.string().max(500).optional(),
//   }),
// };

// /**
//  * Update organization endpoint validation
//  * Validates: params and body
//  */
// export const updateOrganizationValidationSchema: ValidateSchemas = {
//   params: z.object({
//     organizationId: uuidValidator,
//   }),
//   body: z.object({
//     name: z.string().min(1).max(100).optional(),
//     description: z.string().max(500).optional(),
//   }),
// };

// /**
//  * Delete organization endpoint validation
//  * Validates: params
//  */
// export const deleteOrganizationValidationSchema: ValidateSchemas = {
//   params: z.object({
//     organizationId: uuidValidator,
//   }),
// };
