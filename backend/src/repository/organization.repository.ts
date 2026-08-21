import type { Types } from "mongoose";
import { Org } from "../models/organization.model.js";

const isOrganizationNameTakenByUser = async (name: string, ownerId: string) => {
  return await Org.findOne({ name });
};

export const OrgRepository = {
  isOrganizationNameTakenByUser,
};
