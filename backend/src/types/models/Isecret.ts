import type { Types } from "mongoose";

export type SecretEnvironment = "development" | "staging" | "production";

export interface ISecret {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  key: string;
  description?: string;
  encryptedValue: string;
  environment: SecretEnvironment;
  version: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateSecret {
  projectId: Types.ObjectId;
  key: string;
  description?: string;
  encryptedValue: string;
  environment?: SecretEnvironment;
  createdBy: Types.ObjectId;
}
