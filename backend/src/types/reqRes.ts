import type { Request } from "express";

export type ResponseData = {
  success: boolean;
  message: string;
  data?: any;
  statusCode?: number;
};

export interface AuthRequest extends Request {
  userId?: string;
  sessionId?: string;
}
