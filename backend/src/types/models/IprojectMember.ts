import type { Types } from "mongoose";

export type ProjectMemberStatus = "pending" | "active" | "revoked";

export interface IProjectMemberEnvironment {
  envId: Types.ObjectId;
  permissions: string[];
}

export interface IProjectMember {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  sharerId: Types.ObjectId;
  recipientId: Types.ObjectId;
  role: string;
  permissions: string[];
  environment: IProjectMemberEnvironment[];
  status: ProjectMemberStatus;
  invitedAt: Date;
  acceptedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateProjectMember {
  projectId: Types.ObjectId;
  sharerId: Types.ObjectId;
  recipientId: Types.ObjectId;
  role: string;
  permissions?: string[];
  environment?: IProjectMemberEnvironment[];
  status?: ProjectMemberStatus;
  invitedAt?: Date;
  acceptedAt?: Date | null;
  expiresAt?: Date | null;
}
