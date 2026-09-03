import { Types } from "mongoose";
import { OrgRepository } from "../../repository/organization.repository.js";
import type { ResponseData } from "../../types/reqRes.js";
import type { ICreateOrg } from "../../types/models/Iorganization.js";

export const handleCreateOrg = async (
  name: string,
  ownerId: string,
  description?: string,
  visibility: "private" | "internal" = "private",
) => {
  //check same name under owner exist
  const isOrganizationNameTakenByUser =
    await OrgRepository.isOrganizationNameTakenByUser(name, ownerId);

  if (isOrganizationNameTakenByUser) {
    const res: ResponseData = {
      success: false,
      message: "Organization name already exist give some unique name",
      data: null,
      statusCode: 400,
    };
    return res;
  }

  //create org
  const ownerObjectId = new Types.ObjectId(ownerId);
  const payload: ICreateOrg = {
    name,
    ...(description && { description }),
    ownerId: ownerObjectId,
    ...(visibility && { visibility }),
  };
  await OrgRepository.createOrganization(payload);

  const res: ResponseData = {
    success: true,
    message: "Organization created successfully",
    data: null,
    statusCode: 200,
  };
  return res;
};
