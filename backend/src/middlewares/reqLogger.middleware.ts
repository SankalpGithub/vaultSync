import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";

export const httpLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;

    if (statusCode >= 500) {
      logger.error("HTTP request completed", {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode,
        durationMs,
        ip: req.ip,
      });
    } else if (statusCode >= 400) {
      logger.warn("HTTP request completed", {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode,
        durationMs,
        ip: req.ip,
      });
    } else {
      logger.info("HTTP request completed", {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode,
        durationMs,
        ip: req.ip,
      });
    }
  });

  next();
};
