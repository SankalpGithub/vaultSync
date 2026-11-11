import { Types } from "mongoose";
import { Project } from "../models/project.model.js";
import type { ICreateProject } from "../types/models/Iproject.js";

const isProjectNameTakenByUser = async (
  name: string,
  ownerId: string,
  orgId: string,
  excludeProjectId?: string,
) => {
  return await Project.findOne({
    name,
    ownerId: new Types.ObjectId(ownerId),
    orgId: new Types.ObjectId(orgId),
    ...(excludeProjectId && {
      _id: { $ne: new Types.ObjectId(excludeProjectId) },
    }),
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

const updateProjectByOwner = async (
  projectId: string,
  ownerId: string,
  updates: { name: string; description?: string; visibility: "private" | "internal" },
) => {
  return await Project.findOneAndUpdate(
    {
      _id: new Types.ObjectId(projectId),
      ownerId: new Types.ObjectId(ownerId),
      isDeleted: false,
    },
    {
      $set: {
        ...updates,
        lastModifiedBy: new Types.ObjectId(ownerId),
      },
    },
    { new: true, runValidators: true },
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

const createProjectEnvironment = async (
  projectId: string,
  ownerId: string,
  name: string,
) => {
  const normalizedName = name.trim().toLowerCase();
  const namePattern = new RegExp(
    `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    "i",
  );
  const projectFilter = {
    _id: new Types.ObjectId(projectId),
    ownerId: new Types.ObjectId(ownerId),
    isDeleted: false,
  };
  const project = await Project.findOneAndUpdate(
    {
      ...projectFilter,
      environments: {
        $not: {
          $elemMatch: { name: namePattern },
        },
      },
    },
    {
      $push: { environments: { name: normalizedName, isDefault: false } },
      $set: { lastModifiedBy: new Types.ObjectId(ownerId) },
    },
    { new: true, runValidators: true },
  );

  if (project) {
    return { project, alreadyExists: false };
  }

  const existingProject = await Project.findOne(projectFilter).select(
    "environments",
  );

  return {
    project: null,
    alreadyExists:
      existingProject?.environments.some(
        (environment) => environment.name.toLowerCase() === normalizedName,
      ) ?? false,
  };
};

const renameProjectEnvironment = async (
  projectId: string,
  ownerId: string,
  environmentId: string,
  name: string,
) => {
  const normalizedName = name.trim().toLowerCase();
  const projectFilter = {
    _id: new Types.ObjectId(projectId),
    ownerId: new Types.ObjectId(ownerId),
    isDeleted: false,
  };
  const targetEnvironmentId = new Types.ObjectId(environmentId);
  const namePattern = new RegExp(
    `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    "i",
  );
  const project = await Project.findOneAndUpdate(
    {
      ...projectFilter,
      environments: {
        $elemMatch: {
          _id: targetEnvironmentId,
          isDefault: false,
        },
      },
      $and: [
        {
          environments: {
            $not: {
              $elemMatch: {
                _id: { $ne: targetEnvironmentId },
                name: namePattern,
              },
            },
          },
        },
      ],
    },
    {
      $set: {
        "environments.$[environment].name": normalizedName,
        lastModifiedBy: new Types.ObjectId(ownerId),
      },
    },
    {
      arrayFilters: [
        {
          "environment._id": targetEnvironmentId,
          "environment.isDefault": false,
        },
      ],
      new: true,
      runValidators: true,
    },
  );

  if (project) {
    return { project, result: "renamed" as const };
  }

  const existingProject = await Project.findOne(projectFilter).select(
    "environments",
  );
  if (!existingProject) {
    return { project: null, result: "project_not_found" as const };
  }

  const environment = existingProject.environments.find(
    (item) => item._id?.toString() === environmentId,
  );
  if (!environment) {
    return { project: null, result: "environment_not_found" as const };
  }
  if (environment.isDefault) {
    return { project: null, result: "default_environment" as const };
  }

  return { project: null, result: "duplicate" as const };
};

const deleteProjectEnvironment = async (
  projectId: string,
  ownerId: string,
  environmentId: string,
) => {
  const projectFilter = {
    _id: new Types.ObjectId(projectId),
    ownerId: new Types.ObjectId(ownerId),
    isDeleted: false,
  };
  const targetEnvironmentId = new Types.ObjectId(environmentId);
  const project = await Project.findOneAndUpdate(
    {
      ...projectFilter,
      environments: {
        $elemMatch: {
          _id: targetEnvironmentId,
          isDefault: false,
        },
      },
    },
    {
      $pull: { environments: { _id: targetEnvironmentId } },
      $set: { lastModifiedBy: new Types.ObjectId(ownerId) },
    },
    { new: true, runValidators: true },
  );

  if (project) {
    return { project, result: "deleted" as const };
  }

  const existingProject = await Project.findOne(projectFilter).select(
    "environments",
  );
  if (!existingProject) {
    return { project: null, result: "project_not_found" as const };
  }

  const environment = existingProject.environments.find(
    (item) => item._id?.toString() === environmentId,
  );
  if (!environment) {
    return { project: null, result: "environment_not_found" as const };
  }
  if (environment.isDefault) {
    return { project: null, result: "default_environment" as const };
  }

  return { project: null, result: "environment_not_found" as const };
};

export const ProjectRepository = {
  isProjectNameTakenByUser,
  createProject,
  getProjectById,
  deleteProject,
  deleteProjectByOwner,
  updateProjectByOwner,
  getProjectsByOrg,
  getProjectsByOwner,
  createProjectEnvironment,
  renameProjectEnvironment,
  deleteProjectEnvironment,
};
