import { Types } from "mongoose";
import type { Response } from "express";
import {
  handleCreateSecret,
  handleDeleteSecret,
  handleGetSecrets,
  handleGetSecretValue,
} from "../services/secrets/createSecret.service.js";
import type { AuthRequest, ResponseData } from "../types/reqRes.js";
import { AppError } from "../utils/appError.js";
import { sendResponse } from "../utils/responseHandler.js";

export const createSecret = async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    throw new AppError("User not authenticated", 401);
  }

  const { projectId, key, description, encryptedValue, environment } = req.body;
  const result: ResponseData = await handleCreateSecret({
    projectId,
    key,
    ...(description !== undefined && { description }),
    encryptedValue,
    ...(environment !== undefined && { environment }),
    createdBy: new Types.ObjectId(req.userId),
  });

  sendResponse(res, result);
};

export const listSecrets = async (req: AuthRequest, res: Response) => {
  const projectId = req.query.projectId;

  if (typeof projectId !== "string" || !projectId) {
    throw new AppError("Project ID is required", 400);
  }

  const result: ResponseData = await handleGetSecrets(projectId);
  sendResponse(res, result);
};

export const getSecretValue = async (req: AuthRequest, res: Response) => {
  const secretId = req.params.secretId;
  if (!secretId || Array.isArray(secretId)) {
    throw new AppError("Valid Secret ID is required", 400);
  }

  const result: ResponseData = await handleGetSecretValue(secretId);
  sendResponse(res, result);
};

export const deleteSecret = async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    throw new AppError("User not authenticated", 401);
  }

  const secretId = req.params.secretId;
  if (!secretId || Array.isArray(secretId)) {
    throw new AppError("Valid Secret ID is required", 400);
  }

  const result: ResponseData = await handleDeleteSecret(secretId, req.userId);
  sendResponse(res, result);
};
