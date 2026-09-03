import { handleCreateOrg } from "../services/organizations/createOrg.service.js";
import type { ResponseData, AuthRequest } from "../types/reqRes.js";
import type { Response } from "express";
import { sendResponse } from "../utils/responseHandler.js";
import { AppError } from "../utils/appError.js";

/**
 * @route   POST /create-org
 * @desc    Create a new organization
 * @access  secure (requires valid access token)
 */
export const createOrg = async (req: AuthRequest, res: Response) => {
  const { name, description, visibility } = req.body;
  const userId = req.userId;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const result: ResponseData = await handleCreateOrg(
    name,
    userId,
    description,
    visibility,
  );
  sendResponse(res, result);
};

/**
 * @route   DELETE /delete-org
 * @desc    Delete an organization
 * @access  secure (requires valid access token)
 */
export const DeleteOrg = async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  const userId = req.userId;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const result: ResponseData = await handleCreateOrg(name, userId);
  sendResponse(res, result);
};
