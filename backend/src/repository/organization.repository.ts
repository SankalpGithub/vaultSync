import { Types } from "mongoose";
import { Org } from "../models/organization.model.js";
import type { ICreateOrg } from "../types/models/Iorganization.js";

const isOrganizationNameTakenByUser = async (name: string, ownerId: string) => {
  return await Org.findOne({ name, ownerId: new Types.ObjectId(ownerId) });
};

const createOrganization = async (payload: Partial<ICreateOrg>) => {
  return await Org.create(payload as any);
};

export const OrgRepository = {
  isOrganizationNameTakenByUser,
  createOrganization,
};
