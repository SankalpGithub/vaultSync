import { Types } from "mongoose";
import type { ResponseData } from "../../types/reqRes.js";
import { ProjectRepository } from "../../repository/project.repository.js";
import type { ICreateProject } from "../../types/models/Iproject.js";

export const handleCreateProject = async (
  name: string,
  ownerId: string,
  orgId: string,
  description?: string,
  visibility: "private" | "internal" = "private",
) => {
  // Check if project name already exists for this owner in this organization
  const isProjectNameTaken = await ProjectRepository.isProjectNameTakenByUser(
    name,
    ownerId,
    orgId,
  );

  if (isProjectNameTaken) {
    const res: ResponseData = {
      success: false,
      message: "Project name already exists in this organization",
      data: null,
      statusCode: 400,
    };
    return res;
  }

  // Create project
  const ownerObjectId = new Types.ObjectId(ownerId);
  const orgObjectId = new Types.ObjectId(orgId);
  const payload: ICreateProject = {
    name,
    ...(description && { description }),
    ownerId: ownerObjectId,
    orgId: orgObjectId,
    ...(visibility && { visibility }),
  };
  await ProjectRepository.createProject(payload);

  const res: ResponseData = {
    success: true,
    message: "Project created successfully",
    data: null,
    statusCode: 200,
  };
  return res;
};

export const handleListProjects = async (ownerId: string) => {
  const projects = await ProjectRepository.getProjectsByOwner(ownerId);

  const res: ResponseData = {
    success: true,
    message: "Projects fetched successfully",
    data: projects,
    statusCode: 200,
  };
  return res;
};

export const handleDeleteProjectByOwner = async (
  projectId: string,
  ownerId: string,
) => {
  const project = await ProjectRepository.deleteProjectByOwner(
    projectId,
    ownerId,
  );

  const res: ResponseData = project
    ? {
        success: true,
        message: "Project deleted successfully",
        data: project,
        statusCode: 200,
      }
    : {
        success: false,
        message: "Project not found",
        data: null,
        statusCode: 404,
      };
  return res;
};

export const handleDeleteProject = async (projectId: string) => {
  const project = await ProjectRepository.getProjectById(projectId);

  if (!project) {
    const res: ResponseData = {
      success: false,
      message: "Project not found",
      data: null,
      statusCode: 404,
    };
    return res;
  }

  await ProjectRepository.deleteProject(projectId);

  const res: ResponseData = {
    success: true,
    message: "Project deleted successfully",
    data: null,
    statusCode: 200,
  };
  return res;
};
