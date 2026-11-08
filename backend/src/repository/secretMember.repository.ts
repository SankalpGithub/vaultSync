import { Types } from "mongoose";
import { SecretMember } from "../models/secretMember.model.js";
import type {
  ICreateSecretMember,
  SecretMemberStatus,
} from "../types/models/IsecretMember.js";

const createSecretMember = async (
  payload: Partial<ICreateSecretMember>,
) => {
  return await SecretMember.create(payload as any);
};

const updateSecretMemberPermissions = async (
  memberId: string,
  permissions: string[],
) => {
  return await SecretMember.findByIdAndUpdate(
    new Types.ObjectId(memberId),
    { permissions },
    { new: true, runValidators: true },
  );
};

const updateSecretMemberAcceptedAt = async (
  memberId: string,
  acceptedAt: Date | null,
) => {
  return await SecretMember.findByIdAndUpdate(
    new Types.ObjectId(memberId),
    { acceptedAt },
    { new: true, runValidators: true },
  );
};

const updateSecretMemberStatus = async (
  memberId: string,
  status: SecretMemberStatus,
) => {
  return await SecretMember.findByIdAndUpdate(
    new Types.ObjectId(memberId),
    { status },
    { new: true, runValidators: true },
  );
};

export const SecretMemberRepository = {
  createSecretMember,
  updateSecretMemberPermissions,
  updateSecretMemberAcceptedAt,
  updateSecretMemberStatus,
};
