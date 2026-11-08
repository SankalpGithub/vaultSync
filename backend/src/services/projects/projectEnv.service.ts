import type { ResponseData } from "../../types/reqRes.js";
import { ProjectRepository } from "../../repository/project.repository.js";
import { SecretRepository } from "../../repository/secret.repository.js";
import { AppError } from "../../utils/appError.js";

export const handleCreateEnvironment = async (
  projectId: string,
  ownerId: string,
  name: string,
) => {
  const result = await ProjectRepository.createProjectEnvironment(
    projectId,
    ownerId,
    name,
  );

  if (result.alreadyExists) {
    const response: ResponseData = {
      success: false,
      message: "An environment with this name already exists in the project",
      data: null,
      statusCode: 409,
    };
    return response;
  }

  if (!result.project) {
    const response: ResponseData = {
      success: false,
      message: "Project not found",
      data: null,
      statusCode: 404,
    };
    return response;
  }

  const environment = result.project.environments.find(
    (item) => item.name === name.trim().toLowerCase(),
  );

  if (!environment) {
    throw new AppError("Failed to create project environment", 500);
  }

  const response: ResponseData = {
    success: true,
    message: "Environment created successfully",
    data: environment,
    statusCode: 201,
  };
  return response;
};

export const handleRenameEnvironment = async (
  projectId: string,
  ownerId: string,
  environmentId: string,
  name: string,
) => {
  const existingProject = await ProjectRepository.getProjectById(projectId);
  const previousName = existingProject?.environments.find(
    (item) => item._id?.toString() === environmentId,
  )?.name;
  const result = await ProjectRepository.renameProjectEnvironment(
    projectId,
    ownerId,
    environmentId,
    name,
  );

  if (result.result !== "renamed") {
    const failures: Record<
      Exclude<typeof result.result, "renamed">,
      ResponseData
    > = {
      project_not_found: {
        success: false,
        message: "Project not found",
        data: null,
        statusCode: 404,
      },
      environment_not_found: {
        success: false,
        message: "Environment not found",
        data: null,
        statusCode: 404,
      },
      default_environment: {
        success: false,
        message: "Default environments cannot be renamed",
        data: null,
        statusCode: 400,
      },
      duplicate: {
        success: false,
        message: "An environment with this name already exists in the project",
        data: null,
        statusCode: 409,
      },
    };
    return failures[result.result];
  }

  const renamedEnvironment = result.project.environments.find(
    (item) => item._id?.toString() === environmentId,
  );
  if (!renamedEnvironment) {
    throw new AppError("Renamed project environment was not found", 500);
  }
  if (previousName && previousName !== renamedEnvironment.name) {
    await SecretRepository.renameEnvironment(
      projectId,
      previousName,
      renamedEnvironment.name,
    );
  }

  const environment = result.project.environments.find(
    (item) => item._id?.toString() === environmentId,
  );
  if (!environment) {
    throw new AppError("Renamed project environment was not found", 500);
  }

  const response: ResponseData = {
    success: true,
    message: "Environment renamed successfully",
    data: environment,
    statusCode: 200,
  };
  return response;
};

export const handleDeleteEnvironment = async (
  projectId: string,
  ownerId: string,
  environmentId: string,
) => {
  const result = await ProjectRepository.deleteProjectEnvironment(
    projectId,
    ownerId,
    environmentId,
  );

  if (result.result !== "deleted") {
    const failures: Record<
      Exclude<typeof result.result, "deleted">,
      ResponseData
    > = {
      project_not_found: {
        success: false,
        message: "Project not found",
        data: null,
        statusCode: 404,
      },
      environment_not_found: {
        success: false,
        message: "Environment not found",
        data: null,
        statusCode: 404,
      },
      default_environment: {
        success: false,
        message: "Default environments cannot be deleted",
        data: null,
        statusCode: 400,
      },
    };
    return failures[result.result];
  }

  const response: ResponseData = {
    success: true,
    message: "Environment deleted successfully",
    data: null,
    statusCode: 200,
  };
  return response;
};
