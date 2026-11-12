import {
  handleCreateProject,
  handleSoftDeleteProject,
  handleListProjects,
  handleUpdateProject,
} from "../services/projects/createProject.service.js";
import type { ResponseData, AuthRequest } from "../types/reqRes.js";
import type { Response } from "express";
import { sendResponse } from "../utils/responseHandler.js";
import { AppError } from "../utils/appError.js";
import {
  handleCreateEnvironment,
  handleDeleteEnvironment,
  handleRenameEnvironment,
} from "../services/projects/projectEnv.service.js";

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

export const listProjects = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const result: ResponseData = await handleListProjects(userId);
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

  const result: ResponseData = await handleSoftDeleteProject(
    projectId,
    userId,
  );
  sendResponse(res, result);
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  const projectId = req.params.projectId as string | string[];
  const userId = req.userId;
  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }
  if (!projectId || Array.isArray(projectId)) {
    throw new AppError("Valid Project ID is required", 400);
  }

  const { name, description, visibility } = req.body;
  const result: ResponseData = await handleUpdateProject(
    projectId,
    userId,
    { name, description, visibility },
  );
  sendResponse(res, result);
};

/**
 * @route   POST /project/:projectId/environments
 * @desc    Add an environment to a project
 * @access  secure (requires project:delete permission)
 */
export const createProjectEnvironment = async (
  req: AuthRequest,
  res: Response,
) => {
  const userId = req.userId;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const projectId = req.params.projectId as string;
  const { name } = req.body;
  const result: ResponseData = await handleCreateEnvironment(
    projectId,
    userId,
    name,
  );
  sendResponse(res, result);
};

/**
 * @route   PATCH /project/:projectId/environments/:environmentId
 * @desc    Rename a non-default project environment
 * @access  secure (requires project:update permission)
 */
export const renameProjectEnvironment = async (
  req: AuthRequest,
  res: Response,
) => {
  const userId = req.userId;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const projectId = req.params.projectId as string;
  const environmentId = req.params.environmentId as string;
  const { name } = req.body;
  const result: ResponseData = await handleRenameEnvironment(
    projectId,
    userId,
    environmentId,
    name,
  );
  sendResponse(res, result);
};

/**
 * @route   DELETE /project/:projectId/environments/:environmentId
 * @desc    Delete a non-default project environment
 * @access  secure (requires environment:create permission)
 */
export const deleteProjectEnvironment = async (
  req: AuthRequest,
  res: Response,
) => {
  const userId = req.userId;

  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const projectId = req.params.projectId as string;
  const environmentId = req.params.environmentId as string;
  const result: ResponseData = await handleDeleteEnvironment(
    projectId,
    userId,
    environmentId,
  );
  sendResponse(res, result);
};
