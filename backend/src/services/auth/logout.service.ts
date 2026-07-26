import jwt from "jsonwebtoken";
import { env } from "../../configs/env.config.js";
import type { ItokenPayload } from "../../types/tokenPayload.js";
import { sessionRepository } from "../../repository/session.repository.js";
import type { ResponseData } from "../../types/reqRes.js";
import type { Isession } from "../../types/models/Isession.js";

export const handleLogout = async (refreshToken: string) => {
  const payload = jwt.verify(refreshToken, env.JWT_SECRET) as ItokenPayload;

  //get session document
  const sessionId = payload.sessionId;
  const session = await sessionRepository.findSession(sessionId);

  if (!session) {
    const response: ResponseData = {
      success: false,
      message: "Invalid Refresh Token (Session not found)",
      data: null,
      statusCode: 401,
    };
    return response;
  }

  await sessionRepository.updateSession(sessionId, { revoke: true });

  const response: ResponseData = {
    success: true,
    message: "Logout successfully",
    data: null,
    statusCode: 200,
  };
  return response;
};

export const handleLogoutAll = async (refreshToken: string) => {
  const payload = jwt.verify(refreshToken, env.JWT_SECRET) as ItokenPayload;
  const userId = payload.userId;
  const sessions = await sessionRepository.updateUserSessions(userId);
  if (!sessions) {
    const response: ResponseData = {
      success: false,
      message: "Logout All Failed (check refresh token or userId)",
      data: null,
      statusCode: 400,
    };
    return response;
  }

  const response: ResponseData = {
    success: true,
    message: "Logout successfully from all devices",
    data: null,
    statusCode: 200,
  };
  return response;
};
