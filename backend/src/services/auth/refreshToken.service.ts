import { env } from "../../configs/env.config.js";
import type { ResponseData } from "../../types/reqRes.js";
import jwt from "jsonwebtoken";

export const handleRefreshToken = async (refreshToken: string) => {
  try {
    const payload: any = jwt.verify(refreshToken, env.JWT_SECRET);

    const accessToken = jwt.sign({ id: payload.id }, env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const newRefreshToken = jwt.sign({ id: payload.id }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const response: ResponseData = {
      success: true,
      message: "access token generated successfully",
      data: { accessToken, newRefreshToken },
      statusCode: 200,
    };
    return response;
  } catch (error) {
    const response: ResponseData = {
      success: false,
      message: "Invalid Refresh Token",
      data: null,
      statusCode: 401,
    };
    return response;
  }
};
