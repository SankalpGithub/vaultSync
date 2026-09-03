import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../configs/env.config.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "./asycHandler.middleware.js";
import { sessionModel } from "../models/session.model.js";
import type { AuthRequest } from "../types/reqRes.js";
import type { ItokenPayload } from "../types/tokenPayload.js";

/**
 * Middleware to verify access token and validate user session
 *
 * This middleware:
 * 1. Extracts the access token from Authorization header (Bearer <token>)
 * 2. Verifies the JWT token using the JWT_SECRET
 * 3. Extracts userId, sessionId, and type from the token payload
 * 4. Checks that token type is "access"
 * 5. Verifies the session exists and is not revoked
 * 6. Adds userId and sessionId to the request object
 * 7. Calls next() on success
 *
 * @throws {AppError} 401 - If token is missing, invalid, expired, or session is inactive
 */
export const verifyAccessToken = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Extract Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Access token is required", 401);
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.substring(7);

    try {
      // Verify and decode the JWT token
      const decoded = jwt.verify(token, env.JWT_SECRET) as ItokenPayload;

      // Validate token payload structure
      if (!decoded.userId || !decoded.sessionId || !decoded.type) {
        throw new AppError("Invalid token payload", 401);
      }

      // Verify token type is "access"
      if (decoded.type !== "access") {
        throw new AppError("Invalid token type. Expected access token", 401);
      }

      // Check if session exists and is not revoked
      const session = await sessionModel.findById(decoded.sessionId);

      if (!session) {
        throw new AppError("Session not found", 401);
      }

      if (session.revoke === true) {
        throw new AppError("Session has been revoked", 401);
      }

      // Verify session belongs to the user
      if (session.userId.toString() !== decoded.userId) {
        throw new AppError("Session does not belong to this user", 401);
      }

      // Attach user and session info to request
      req.userId = decoded.userId;
      req.sessionId = decoded.sessionId;

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError("Invalid or malformed token", 401);
      }

      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError("Access token has expired", 401);
      }

      // Re-throw AppError or other errors
      throw error;
    }
  },
);
