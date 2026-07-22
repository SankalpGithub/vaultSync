import { env } from "../../configs/env.config.js";
import type { ResponseData } from "../../types/reqRes.js";
import jwt from "jsonwebtoken";
import { sessionRepository } from "../../repository/session.repository.js";
import { hashToken } from "../../utils/hash.js";
import type { ItokenPayload } from "../../types/tokenPayload.js";

export const handleRefreshToken = async (refreshToken: string) => {
  try {
    const payload = jwt.verify(refreshToken, env.JWT_SECRET) as ItokenPayload;

    //get session document
    const sessionId = payload.sessionId;
    const session = await sessionRepository.findSession(sessionId);

    if (!session) {
      const response: ResponseData = {
        success: false,
        message: "Invalid Refresh Token",
        data: null,
        statusCode: 401,
      };
      return response;
    }

    //check if session has been revoked
    if (session.revoke == true) {
      const response: ResponseData = {
        success: false,
        message: "Session has been revoked. Please sign in again.",
        data: null,
        statusCode: 401,
      };
      return response;
    }

    //create access token
    const accessTokenPayload: ItokenPayload = {
      userId: payload.userId,
      sessionId: sessionId,
      type: "access",
    };
    const accessToken = jwt.sign(accessTokenPayload, env.JWT_SECRET, {
      expiresIn: "15m",
    });

    //create refresh token
    const refreshTokenPayload: ItokenPayload = {
      userId: payload.userId,
      sessionId: sessionId,
      type: "refresh",
    };

    const newRefreshToken = jwt.sign(refreshTokenPayload, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const refreshTokenHash = hashToken(newRefreshToken);

    //update session refresh token
    await sessionRepository.updateSession(sessionId, { refreshTokenHash });

    const response: ResponseData = {
      success: true,
      message: "access token generated successfully",
      data: { accessToken, newRefreshToken },
      statusCode: 200,
    };
    return response;
  } catch (error) {
    let response: ResponseData;

    if (error instanceof jwt.TokenExpiredError) {
      response = {
        success: false,
        message: "Refresh token has expired. Please sign in again.",
        data: null,
        statusCode: 401,
      };
    } else if (error instanceof jwt.JsonWebTokenError) {
      response = {
        success: false,
        message: "Invalid refresh token.",
        data: null,
        statusCode: 401,
      };
    } else if (error instanceof jwt.NotBeforeError) {
      response = {
        success: false,
        message: "Refresh token is not active yet.",
        data: null,
        statusCode: 401,
      };
    } else {
      console.error(error);

      response = {
        success: false,
        message: "Internal server error.",
        data: null,
        statusCode: 500,
      };
    }

    return response;
  }
};
