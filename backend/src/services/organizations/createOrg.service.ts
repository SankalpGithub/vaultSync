import { Types } from "mongoose";
import { OrgRepository } from "../../repository/organization.repository.js";
import type { ResponseData } from "../../types/reqRes.js";
import type { ICreateOrg } from "../../types/models/Iorganization.js";
import { Org } from "../../models/organization.model.js";
import { AccessGrant } from "../../models/accessGrant.model.js";
import { activeGrantFilter } from "../sharing/access.service.js";
import { Project } from "../../models/project.model.js";
import { Secret } from "../../models/secret.model.js";

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

export const handleListOrganizations = async (ownerId: string) => {
  const owned = await OrgRepository.getOrganizationsByOwner(ownerId);
  const readablePermissions = [
    "organization:read",
    "organization:projects:list",
    "project:read",
    "secret:list",
    "secret:metadata:read",
  ];
  const sharedGrants = await AccessGrant.find({
    ...activeGrantFilter(ownerId),
    permissions: { $in: readablePermissions },
    resourceType: { $in: ["organization", "project", "secret"] },
  }).select("resourceType resourceId projectId");
  const organizationIds = sharedGrants
    .filter((grant) => grant.resourceType === "organization")
    .map((grant) => grant.resourceId);
  const projectIds = sharedGrants
    .filter((grant) => grant.resourceType === "project")
    .map((grant) => grant.resourceId);
  const secretIds = sharedGrants
    .filter((grant) => grant.resourceType === "secret")
    .map((grant) => grant.resourceId);
  const [sharedProjects, sharedSecrets] = await Promise.all([
    projectIds.length
      ? Project.find({
          _id: { $in: projectIds },
          isDeleted: false,
        }).select("orgId")
      : Promise.resolve([]),
    secretIds.length
      ? Secret.find({ _id: { $in: secretIds }, isDeleted: false })
          .select("projectId")
      : Promise.resolve([]),
  ]);
  const secretProjectIds = [
    ...new Set(sharedSecrets.map((item) => item.projectId.toString())),
  ];
  const secretProjects = secretProjectIds.length
    ? await Project.find({
        _id: { $in: secretProjectIds },
        isDeleted: false,
      }).select("orgId")
    : [];
  const sharedIds = [
    ...new Set([
      ...organizationIds.map((id) => id.toString()),
      ...sharedProjects.map((item) => item.orgId.toString()),
      ...secretProjects.map((item) => item.orgId.toString()),
    ]),
  ];
  const shared = sharedIds.length
    ? await Org.find({
        _id: { $in: sharedIds.map((id) => new Types.ObjectId(id)) },
        isDeleted: false,
      }).sort({ createdAt: -1 })
    : [];
  const organizations = [
    ...owned,
    ...shared.filter(
      (item) => !owned.some((ownedItem) => ownedItem._id.toString() === item._id.toString()),
    ),
  ];

  const res: ResponseData = {
    success: true,
    message: "Organizations fetched successfully",
    data: organizations,
    statusCode: 200,
  };
  return res;
};

export const handleDeleteOrganization = async (
  organizationId: string,
  actorId: string,
) => {
  const organization = await OrgRepository.deleteOrganization(
    organizationId,
    actorId,
  );

  const res: ResponseData = organization
    ? {
        success: true,
        message: "Organization deleted successfully",
        data: organization,
        statusCode: 200,
      }
    : {
        success: false,
        message: "Organization not found",
        data: null,
        statusCode: 404,
      };
  return res;
};
