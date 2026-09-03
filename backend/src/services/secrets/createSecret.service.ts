import type { ICreateSecret } from "../../types/models/Isecret.js";
import type { ResponseData } from "../../types/reqRes.js";
import { SecretRepository } from "../../repository/secret.repository.js";
import { decryptSecret, encryptSecret } from "../../utils/encryption.js";

export const handleCreateSecret = async (
  payload: ICreateSecret,
): Promise<ResponseData> => {
  const environment = payload.environment || "development";
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
): Promise<ResponseData> => {
  const secrets = await SecretRepository.getSecretsByProject(projectId);

  return {
    success: true,
    message: "Secrets fetched successfully",
    data: secrets,
    statusCode: 200,
  };
};

export const handleGetSecretValue = async (
  secretId: string,
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

  return {
    success: true,
    message: "Secret value fetched successfully",
    data: { value: decryptSecret(secret.encryptedValue) },
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
