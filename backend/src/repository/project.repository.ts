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

const deleteProjectByOwner = async (projectId: string, ownerId: string) => {
  return await Project.findOneAndUpdate(
    {
      _id: new Types.ObjectId(projectId),
      ownerId: new Types.ObjectId(ownerId),
      isDeleted: false,
    },
    {
      isDeleted: true,
      deletedAt: new Date(),
      lastModifiedBy: new Types.ObjectId(ownerId),
    },
    { new: true },
  );
};

const getProjectsByOrg = async (orgId: string) => {
  return await Project.find({
    orgId: new Types.ObjectId(orgId),
    isDeleted: false,
  });
};

const getProjectsByOwner = async (ownerId: string) => {
  return await Project.find({
    ownerId: new Types.ObjectId(ownerId),
    isDeleted: false,
  }).sort({ createdAt: -1 });
};

export const ProjectRepository = {
  isProjectNameTakenByUser,
  createProject,
  getProjectById,
  deleteProject,
  deleteProjectByOwner,
  getProjectsByOrg,
  getProjectsByOwner,
};
