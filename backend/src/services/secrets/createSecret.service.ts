import type { ICreateSecret } from "../../types/models/Isecret.js";
import type { ResponseData } from "../../types/reqRes.js";
import { SecretRepository } from "../../repository/secret.repository.js";
import { ProjectRepository } from "../../repository/project.repository.js";
import { decryptSecret, encryptSecret } from "../../utils/encryption.js";
import { getActiveResourceIds, hasActiveGrant } from "../sharing/access.service.js";

export const handleCreateSecret = async (
  payload: ICreateSecret,
): Promise<ResponseData> => {
  const environment = payload.environment || "development";
  const project = await ProjectRepository.getProjectById(
    payload.projectId.toString(),
  );
  if (!project || project.isDeleted) {
    return {
      success: false,
      message: "Project not found",
      data: null,
      statusCode: 404,
    };
  }
  if (!project.environments.some((item) => item.name === environment)) {
    return {
      success: false,
      message: "Environment is not available in this project",
      data: null,
      statusCode: 400,
    };
  }

  const existingSecret = await SecretRepository.findByKey(
    payload.projectId.toString(),
    payload.key,
    environment,
  );

  if (existingSecret) {
    return {
      success: false,
      message: "A secret with this key already exists in this environment",
      data: null,
      statusCode: 409,
    };
  }

  const encryptedSecretValue = encryptSecret(payload.encryptedValue);
  const secret = await SecretRepository.createSecret({
    ...payload,
    encryptedValue: encryptedSecretValue,
    environment,
  });

  return {
    success: true,
    message: "Secret created successfully",
    data: secret,
    statusCode: 201,
  };
};

export const handleGetSecrets = async (
  projectId: string,
  userId?: string,
): Promise<ResponseData> => {
  let secrets = await SecretRepository.getSecretsByProject(projectId);
  if (userId) {
    const project = await ProjectRepository.getProjectById(projectId);
    const isOwner = project?.ownerId.toString() === userId;
    if (!isOwner) {
      const sharedProjects = await getActiveResourceIds(userId, "project");
      const sharedSecrets = await getActiveResourceIds(userId, "secret");
      if (!sharedProjects.includes(projectId)) {
        secrets = secrets.filter((secret) => sharedSecrets.includes(secret._id.toString()));
      }
      if (sharedSecrets.length) {
        secrets = secrets.filter((secret) =>
          sharedSecrets.includes(secret._id.toString()) ||
          sharedProjects.includes(projectId),
        );
      }
    }
  }

  return {
    success: true,
    message: "Secrets fetched successfully",
    data: secrets,
    statusCode: 200,
  };
};

export const handleGetSecretValue = async (
  secretId: string,
  userId?: string,
): Promise<ResponseData> => {
  const secret = await SecretRepository.getSecretById(secretId);

  if (!secret) {
    return {
      success: false,
      message: "Secret not found",
      data: null,
      statusCode: 404,
    };
  }
  if (userId) {
    const project = await ProjectRepository.getProjectById(secret.projectId.toString());
    const isOwner = project?.ownerId.toString() === userId;
    const environmentId = project?.environments
      .find((environment) => environment.name === secret.environment)
      ?._id?.toString();
    const [secretGrant, environmentGrant, projectGrant] = await Promise.all([
      hasActiveGrant(userId, "secret", secretId, ["secret:value:read"]),
      environmentId
        ? hasActiveGrant(userId, "environment", environmentId, ["secret:value:read"])
        : Promise.resolve(false),
      hasActiveGrant(userId, "project", secret.projectId.toString(), ["secret:value:read"]),
    ]);
    if (!isOwner && !secretGrant && !environmentGrant && !projectGrant) {
      return { success: false, message: "You do not have permission to reveal this secret", data: null, statusCode: 403 };
    }
  }

  return {
    success: true,
    message: "Secret value fetched successfully",
    data: { value: decryptSecret(secret.encryptedValue) },
    statusCode: 200,
  };
};

export const handleUpdateSecret = async (
  secretId: string,
  key: string,
  value: string,
  userId: string,
): Promise<ResponseData> => {
  const secret = await SecretRepository.getSecretById(secretId);

  if (!secret) {
    return {
      success: false,
      message: "Secret not found",
      data: null,
      statusCode: 404,
    };
  }

  const existingSecret = await SecretRepository.findByKey(
    secret.projectId.toString(),
    key,
    secret.environment,
    secretId,
  );

  if (existingSecret) {
    return {
      success: false,
      message: "A secret with this key already exists in this environment",
      data: null,
      statusCode: 409,
    };
  }

  const updatedSecret = await SecretRepository.updateSecret(
    secretId,
    key,
    encryptSecret(value),
    userId,
  );

  if (!updatedSecret) {
    return {
      success: false,
      message: "Secret not found",
      data: null,
      statusCode: 404,
    };
  }

  return {
    success: true,
    message: "Secret updated successfully",
    data: updatedSecret,
    statusCode: 200,
  };
};

export const handleDeleteSecret = async (
  secretId: string,
  userId: string,
): Promise<ResponseData> => {
  const secret = await SecretRepository.deleteSecret(secretId, userId);

  return secret
    ? {
        success: true,
        message: "Secret deleted successfully",
        data: null,
        statusCode: 200,
      }
    : {
        success: false,
        message: "Secret not found",
        data: null,
        statusCode: 404,
      };
};
