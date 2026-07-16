import { env } from "../../configs/env.config.js";
import { sessionRepository } from "../../repository/session.repository.js";
import { UserRepository } from "../../repository/user.repository.js";
import type { Isession } from "../../types/models/Isession.js";
import type { ResponseData } from "../../types/reqRes.js";
import { compareHash, createHash } from "../../utils/hash.js";
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

  const refreshToken = jwt.sign({ id: user.id }, env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const refreshTokenHash = await createHash(refreshToken);

  const session: Isession = {
    userId: user._id,
    refreshHash: refreshTokenHash,
    ip: ip,
    userAgent: userAgent,
    revoke: false,
  };

  //create sessoin
  await sessionRepository.createSession(session);

  const accessToken = jwt.sign({ id: user.id }, env.JWT_SECRET, {
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
