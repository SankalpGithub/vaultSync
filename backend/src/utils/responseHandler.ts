import type { Response } from "express";
import type { ResponseData } from "../types/reqRes.js";
export const sendResponse = (
  res: Response,
  { success, message, data, statusCode = 200 }: ResponseData,
) => {
  return res.status(statusCode).json({
    success,
    message,
    data: data || null,
  });
};
