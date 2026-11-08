import { Types } from "mongoose";
import { OrgCollaborator } from "../models/orgCollaborator.model.js";
import type {
  ICreateOrgCollaborator,
  OrgCollaboratorInvitationStatus,
  OrgCollaboratorStatus,
} from "../types/models/IorgCollaborator.js";

const createOrgCollaborator = async (
  payload: Partial<ICreateOrgCollaborator>,
) => {
  return await OrgCollaborator.create(payload as any);
};

const updateOrgCollaboratorPermissions = async (
  collaboratorId: string,
  permissions: string[],
) => {
  return await OrgCollaborator.findByIdAndUpdate(
    new Types.ObjectId(collaboratorId),
    { permissions },
    { new: true, runValidators: true },
  );
};

const updateOrgCollaboratorRole = async (
  collaboratorId: string,
  role: string,
) => {
  return await OrgCollaborator.findByIdAndUpdate(
    new Types.ObjectId(collaboratorId),
    { role },
    { new: true, runValidators: true },
  );
};

const updateOrgCollaboratorAcceptedAt = async (
  collaboratorId: string,
  acceptedAt: Date | null,
) => {
  return await OrgCollaborator.findByIdAndUpdate(
    new Types.ObjectId(collaboratorId),
    { acceptedAt },
    { new: true, runValidators: true },
  );
};

const updateOrgCollaboratorStatus = async (
  collaboratorId: string,
  status: OrgCollaboratorStatus,
) => {
  return await OrgCollaborator.findByIdAndUpdate(
    new Types.ObjectId(collaboratorId),
    { status },
    { new: true, runValidators: true },
  );
};

const updateOrgCollaboratorInvitationStatus = async (
  collaboratorId: string,
  invitationStatus: OrgCollaboratorInvitationStatus,
) => {
  return await OrgCollaborator.findByIdAndUpdate(
    new Types.ObjectId(collaboratorId),
    { invitationStatus },
    { new: true, runValidators: true },
  );
};

export const OrgCollaboratorRepository = {
  createOrgCollaborator,
  updateOrgCollaboratorPermissions,
  updateOrgCollaboratorRole,
  updateOrgCollaboratorAcceptedAt,
  updateOrgCollaboratorStatus,
  updateOrgCollaboratorInvitationStatus,
};
