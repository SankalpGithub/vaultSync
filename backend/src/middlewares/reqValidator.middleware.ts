import { ZodObject } from "zod";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError.js";

export enum ValidationSource {
  BODY = "body",
  QUERY = "query",
  HEADER = "headers",
  PARAMS = "params",
}

export const validateReq = (schema: ZodObject, source: ValidationSource) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      return next(new AppError(message, 400));
    }

    req[source] = result.data;
    return next();
  };
};
