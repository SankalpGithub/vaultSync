import { Types } from "mongoose";
import { ProjectMember } from "../models/projectMember.model.js";
import type {
  ICreateProjectMember,
  IProjectMemberEnvironment,
  ProjectMemberStatus,
} from "../types/models/IprojectMember.js";

const createProjectMember = async (
  payload: Partial<ICreateProjectMember>,
) => {
  return await ProjectMember.create(payload as any);
};

const updateProjectMemberPermissions = async (
  memberId: string,
  permissions: string[],
) => {
  return await ProjectMember.findByIdAndUpdate(
    new Types.ObjectId(memberId),
    { permissions },
    { new: true, runValidators: true },
  );
};

const updateProjectMemberEnvironmentPermissions = async (
  memberId: string,
  environment: IProjectMemberEnvironment[],
) => {
  return await ProjectMember.findByIdAndUpdate(
    new Types.ObjectId(memberId),
    { environment },
    { new: true, runValidators: true },
  );
};

const updateProjectMemberRole = async (memberId: string, role: string) => {
  return await ProjectMember.findByIdAndUpdate(
    new Types.ObjectId(memberId),
    { role },
    { new: true, runValidators: true },
  );
};

const updateProjectMemberAcceptedAt = async (
  memberId: string,
  acceptedAt: Date | null,
) => {
  return await ProjectMember.findByIdAndUpdate(
    new Types.ObjectId(memberId),
    { acceptedAt },
    { new: true, runValidators: true },
  );
};

const updateProjectMemberStatus = async (
  memberId: string,
  status: ProjectMemberStatus,
) => {
  return await ProjectMember.findByIdAndUpdate(
    new Types.ObjectId(memberId),
    { status },
    { new: true, runValidators: true },
  );
};

export const ProjectMemberRepository = {
  createProjectMember,
  updateProjectMemberPermissions,
  updateProjectMemberEnvironmentPermissions,
  updateProjectMemberRole,
  updateProjectMemberAcceptedAt,
  updateProjectMemberStatus,
};
