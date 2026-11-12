import { Types } from "mongoose";
import type { ResponseData } from "../../types/reqRes.js";
import { ProjectRepository } from "../../repository/project.repository.js";
import type { ICreateProject } from "../../types/models/Iproject.js";
import { AccessGrant } from "../../models/accessGrant.model.js";
import { activeGrantFilter } from "../sharing/access.service.js";
import { Project } from "../../models/project.model.js";
import { Secret } from "../../models/secret.model.js";

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
  const owned = await ProjectRepository.getProjectsByOwner(ownerId);
  const [projectGrants, organizationGrants, secretGrants] = await Promise.all([
    AccessGrant.find({
      ...activeGrantFilter(ownerId),
      resourceType: "project",
      permissions: { $in: ["project:read", "secret:list"] },
    }).select("resourceId"),
    AccessGrant.find({
      ...activeGrantFilter(ownerId),
      resourceType: "organization",
      permissions: {
        $in: ["project:read", "organization:projects:list", "secret:list"],
      },
    }).select("resourceId"),
    AccessGrant.find({
      ...activeGrantFilter(ownerId),
      resourceType: "secret",
      permissions: "secret:list",
    }).select("resourceId projectId"),
  ]);
  const sharedProjectIds = [
    ...projectGrants.map((grant) => grant.resourceId),
    ...secretGrants.flatMap((grant) =>
      grant.projectId ? [grant.projectId] : [],
    ),
  ];
  const sharedOrganizationIds = organizationGrants.map(
    (grant) => grant.resourceId,
  );
  const secretGrantsWithoutProject = secretGrants.filter(
    (grant) => !grant.projectId,
  );
  const grantedSecrets = secretGrantsWithoutProject.length
    ? await Secret.find({
        _id: { $in: secretGrantsWithoutProject.map((grant) => grant.resourceId) },
        isDeleted: false,
      }).select("projectId")
    : [];
  sharedProjectIds.push(...grantedSecrets.map((secret) => secret.projectId));
  const uniqueSharedProjectIds = [
    ...new Map(sharedProjectIds.map((id) => [id.toString(), id])).values(),
  ];
  const uniqueSharedOrganizationIds = [
    ...new Map(
      sharedOrganizationIds.map((id) => [id.toString(), id]),
    ).values(),
  ];
  const shared = uniqueSharedProjectIds.length || uniqueSharedOrganizationIds.length
    ? await Project.find({
        $or: [
          ...(uniqueSharedProjectIds.length
            ? [{ _id: { $in: uniqueSharedProjectIds } }]
            : []),
          ...(uniqueSharedOrganizationIds.length
            ? [{ orgId: { $in: uniqueSharedOrganizationIds } }]
            : []),
        ],
        isDeleted: false,
      }).sort({ createdAt: -1 })
    : [];
  const projects = [
    ...owned,
    ...shared.filter(
      (item) => !owned.some((ownedItem) => ownedItem._id.toString() === item._id.toString()),
    ),
  ];

  const res: ResponseData = {
    success: true,
    message: "Projects fetched successfully",
    data: projects,
    statusCode: 200,
  };
  return res;
};

export const handleSoftDeleteProject = async (
  projectId: string,
  ownerId: string,
) => {
  const project = await ProjectRepository.softDeleteProject(
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

export const handleUpdateProject = async (
  projectId: string,
  ownerId: string,
  updates: {
    name: string;
    description?: string;
    visibility: "private" | "internal";
  },
) => {
  const project = await ProjectRepository.getProjectById(projectId);
  if (!project || project.isDeleted) {
    return {
      success: false,
      message: "Project not found",
      data: null,
      statusCode: 404,
    } satisfies ResponseData;
  }

  const isNameTaken = await ProjectRepository.isProjectNameTakenByUser(
    updates.name,
    ownerId,
    project.orgId.toString(),
    projectId,
  );
  if (isNameTaken) {
    return {
      success: false,
      message: "Project name already exists in this organization",
      data: null,
      statusCode: 400,
    } satisfies ResponseData;
  }

  const updatedProject = await ProjectRepository.updateProject(
    projectId,
    ownerId,
    updates,
  );
  return updatedProject
    ? {
        success: true,
        message: "Project updated successfully",
        data: updatedProject,
        statusCode: 200,
      }
    : {
        success: false,
        message: "Project not found",
        data: null,
        statusCode: 404,
      };
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
