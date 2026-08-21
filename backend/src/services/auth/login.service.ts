import { env } from "../../configs/env.config.js";
import { sessionRepository } from "../../repository/session.repository.js";
import { UserRepository } from "../../repository/user.repository.js";
import type { Isession } from "../../types/models/Isession.js";
import type { ResponseData } from "../../types/reqRes.js";
import type { ItokenPayload } from "../../types/tokenPayload.js";
import { compareHash, hashToken } from "../../utils/hash.js";
import { logger } from "../../utils/logger.js";
import jwt from "jsonwebtoken";

export const handleLogin = async (bodyObject: any) => {
  const { email, password, body, ip, userAgent } = bodyObject;

  const user = await UserRepository.findUser({ email });
  if (!user) {
    logger.error("User not found", {
      statuscode: 404,
    });

    const res: ResponseData = {
      success: false,
      message: "User not found",
      data: null,
      statusCode: 404,
    };
    return res;
  }

  const matchPassword = await compareHash(password, user.passwordHash);

  if (!matchPassword) {
    const res: ResponseData = {
      success: false,
      message: "Incorrect Password",
      data: null,
      statusCode: 401,
    };
    return res;
  }

  const sessionObject: Isession = {
    userId: user._id,
    refreshTokenHash: "",
    ip: ip,
    userAgent: userAgent,
    revoke: false,
  };

  //create sessoin
  const session = await sessionRepository.createSession(sessionObject);

  //create refresh token
  const refreshTokenPayload: ItokenPayload = {
    userId: user.id,
    sessionId: session.id,
    type: "refresh",
  };

  const refreshToken = jwt.sign(refreshTokenPayload, env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const refreshTokenHash = hashToken(refreshToken);

  //update session with refresh token
  await sessionRepository.updateSession(session.id, {
    refreshTokenHash,
  });

  //create access token
  const accessTokenPayload: ItokenPayload = {
    userId: user.id,
    sessionId: session.id,
    type: "access",
  };

  const accessToken = jwt.sign(accessTokenPayload, env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const res: ResponseData = {
    success: true,
    message: "Login successfully",
    data: { accessToken, refreshToken },
    statusCode: 200,
  };
  return res;
};
