import { ZodObject } from "zod";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError.js";

export enum ValidationSource {
  BODY = "body",
  QUERY = "query",
  HEADER = "headers",
  PARAMS = "params",
  COOKIES = "cookies",
}

export const validateReq = (schema: ZodObject, source: ValidationSource) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body || {},
      query: req.query || {},
      params: req.params || {},
      headers: req.headers || {},
      cookies: req.cookies || {},
    });

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      return next(new AppError(message, 400));
    }

    req.body = result.data.body as Request["body"];
    req.params = result.data.params as Request["params"];
    req.headers = result.data.headers as Request["headers"];
    (req as any).cookies = result.data.cookies;

    return next();
  };
};
