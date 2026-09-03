import {
  handleCreateProject,
  handleDeleteProject,
} from "../services/projects/createProject.service.js";
import type { ResponseData, AuthRequest } from "../types/reqRes.js";
import type { Response } from "express";
import { sendResponse } from "../utils/responseHandler.js";
import { AppError } from "../utils/appError.js";

/**
 * @route   POST /project/create
 * @desc    Create a new project
 * @access  secure (requires valid access token)
 */
export const createProject = async (req: AuthRequest, res: Response) => {
  const { name, orgId, description, visibility } = req.body;
  const userId = req.userId;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const result: ResponseData = await handleCreateProject(
    name,
    userId,
    orgId,
    description,
    visibility,
  );
  sendResponse(res, result);
};

/**
 * @route   DELETE /project/:projectId
 * @desc    Delete a project
 * @access  secure (requires valid access token)
 */
export const deleteProject = async (req: AuthRequest, res: Response) => {
  const projectId = req.params.projectId as string | string[];
  const userId = req.userId;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  if (!projectId || Array.isArray(projectId)) {
    throw new AppError("Valid Project ID is required", 400);
  }

  const result: ResponseData = await handleDeleteProject(projectId);
  sendResponse(res, result);
};
