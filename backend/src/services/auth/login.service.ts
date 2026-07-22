import { env } from "../../configs/env.config.js";
import { sessionRepository } from "../../repository/session.repository.js";
import { UserRepository } from "../../repository/user.repository.js";
import type { Isession } from "../../types/models/Isession.js";
import type { ResponseData } from "../../types/reqRes.js";
import { compareHash, hashToken } from "../../utils/hash.js";
import { logger } from "../../utils/logger.js";
import jwt from "jsonwebtoken";

export const handleLogin = async (bodyObject: any) => {
  const { email, password, body, ip, userAgent } = bodyObject;

  const user = await UserRepository.findUserByEmail(email);
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

  const refreshToken = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const refreshTokenHash = hashToken(refreshToken);

  const sessionObject: Isession = {
    userId: user._id,
    refreshTokenHash,
    ip: ip,
    userAgent: userAgent,
    revoke: false,
  };

  //create sessoin
  const session = await sessionRepository.createSession(sessionObject);

  const accessToken = jwt.sign(
    { userId: user.id, sessionId: session.id },
    env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  const res: ResponseData = {
    success: true,
    message: "Login successfully",
    data: { accessToken, refreshToken },
    statusCode: 200,
  };
  return res;
};
