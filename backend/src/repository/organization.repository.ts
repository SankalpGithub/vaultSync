import { Types } from "mongoose";
import { Org } from "../models/organization.model.js";
import type { ICreateOrg } from "../types/models/Iorganization.js";

const isOrganizationNameTakenByUser = async (name: string, ownerId: string) => {
  return await Org.findOne({ name, ownerId: new Types.ObjectId(ownerId) });
};

const createOrganization = async (payload: Partial<ICreateOrg>) => {
  return await Org.create(payload as any);
};

const getOrganizationsByOwner = async (ownerId: string) => {
  return await Org.find({
    ownerId: new Types.ObjectId(ownerId),
    isDeleted: false,
  }).sort({ createdAt: -1 });
};

const deleteOrganizationByOwner = async (
  organizationId: string,
  ownerId: string,
) => {
  return await Org.findOneAndUpdate(
    {
      _id: new Types.ObjectId(organizationId),
      ownerId: new Types.ObjectId(ownerId),
      isDeleted: false,
    },
    {
      isDeleted: true,
      deletedAt: new Date(),
      lastModifiedBy: new Types.ObjectId(ownerId),
    },
    { new: true },
  );
};

export const OrgRepository = {
  isOrganizationNameTakenByUser,
  createOrganization,
  getOrganizationsByOwner,
  deleteOrganizationByOwner,
};
