// middlewares/errorMiddleware.ts
import type { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/responseHandler.js";
import { logger } from "../utils/logger.js";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode: number = err.statusCode || 500;
  logger.error({
    message: err.message,
    statusCode: err.statusCode || 500,
    method: req.method,
    url: req.originalUrl || req.url,
  });

  const message: string =
    statusCode === 500 ? "Internal Server Error" : err.message;

  return sendResponse(res, {
    success: false,
    message,
    statusCode,
  });
};
