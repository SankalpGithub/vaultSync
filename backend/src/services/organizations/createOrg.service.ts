import { OrgRepository } from "../../repository/organization.repository.js";
import type { ResponseData } from "../../types/reqRes.js";

export const handleCreateOrg = async (name: string, ownerId: string) => {
  //check same name under owner exist
  const isOrganizationNameTakenByUser =
    await OrgRepository.isOrganizationNameTakenByUser(name, ownerId);

  //create org

  const res: ResponseData = {
    success: true,
    message: "Organization create successfully",
    data: null,
    statusCode: 200,
  };
  return res;
};
