import { Types } from "mongoose";
import { Project } from "../models/project.model.js";
import type { ICreateProject } from "../types/models/Iproject.js";

const isProjectNameTakenByUser = async (
  name: string,
  ownerId: string,
  orgId: string,
) => {
  return await Project.findOne({
    name,
    ownerId: new Types.ObjectId(ownerId),
    orgId: new Types.ObjectId(orgId),
  });
};

const createProject = async (payload: Partial<ICreateProject>) => {
  return await Project.create(payload as any);
};

const getProjectById = async (projectId: string) => {
  return await Project.findById(new Types.ObjectId(projectId));
};

const deleteProject = async (projectId: string) => {
  return await Project.findByIdAndDelete(new Types.ObjectId(projectId));
};

const getProjectsByOrg = async (orgId: string) => {
  return await Project.find({ orgId: new Types.ObjectId(orgId) });
};

export const ProjectRepository = {
  isProjectNameTakenByUser,
  createProject,
  getProjectById,
  deleteProject,
  getProjectsByOrg,
};
