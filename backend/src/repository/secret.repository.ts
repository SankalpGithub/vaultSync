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
) => {
  return await Secret.findOne({
    projectId: new Types.ObjectId(projectId),
    key,
    environment,
    isDeleted: false,
  });
};

const createSecret = async (payload: ICreateSecret) => {
  return await Secret.create(payload);
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
  getSecretsByProject,
  getSecretById,
  deleteSecret,
};
