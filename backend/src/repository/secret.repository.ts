import { Types } from "mongoose";
import { Secret } from "../models/secret.model.js";
import type {
  ICreateSecret,
  SecretEnvironment,
} from "../types/models/Isecret.js";

const findByKey = async (
  projectId: string,
  key: string,
  environment: SecretEnvironment,
  excludedSecretId?: string,
  includeDeleted = false,
) => {
  return await Secret.findOne({
    projectId: new Types.ObjectId(projectId),
    key,
    environment,
    ...(!includeDeleted && { isDeleted: false }),
    ...(excludedSecretId && {
      _id: { $ne: new Types.ObjectId(excludedSecretId) },
    }),
  });
};

const createSecret = async (payload: ICreateSecret) => {
  return await Secret.create(payload);
};

const renameEnvironment = async (
  projectId: string,
  previousName: string,
  nextName: string,
) => {
  return await Secret.updateMany(
    {
      projectId: new Types.ObjectId(projectId),
      environment: previousName,
      isDeleted: false,
    },
    { $set: { environment: nextName } },
  );
};

const getSecretsByProject = async (projectId: string) => {
  return await Secret.find({
    projectId: new Types.ObjectId(projectId),
    isDeleted: false,
  }).sort({ key: 1 });
};

const getSecretById = async (secretId: string) => {
  return await Secret.findOne({
    _id: new Types.ObjectId(secretId),
    isDeleted: false,
  }).select("+encryptedValue");
};

const updateSecret = async (
  secretId: string,
  key: string | undefined,
  encryptedValue: string | undefined,
  userId: string,
) => {
  const updates = {
    updatedBy: new Types.ObjectId(userId),
    ...(key !== undefined && { key }),
    ...(encryptedValue !== undefined && { encryptedValue }),
  };

  return await Secret.findOneAndUpdate(
    {
      _id: new Types.ObjectId(secretId),
      isDeleted: false,
    },
    {
      $set: updates,
      $inc: { version: 1 },
    },
    { new: true, runValidators: true },
  );
};

const deleteSecret = async (secretId: string, userId: string) => {
  return await Secret.findOneAndUpdate(
    {
      _id: new Types.ObjectId(secretId),
      isDeleted: false,
    },
    {
      isDeleted: true,
      deletedAt: new Date(),
      updatedBy: new Types.ObjectId(userId),
    },
    { new: true },
  ).select("+encryptedValue");
};

export const SecretRepository = {
  findByKey,
  createSecret,
  renameEnvironment,
  getSecretsByProject,
  getSecretById,
  updateSecret,
  deleteSecret,
};
