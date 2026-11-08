import { Types } from "mongoose";
import { AccessGrant } from "../../models/accessGrant.model.js";

export const activeGrantFilter = (userId: string) => ({
  userId: new Types.ObjectId(userId),
  status: "active" as const,
  $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
});

export const getActiveResourceIds = async (
  userId: string,
  resourceType: "organization" | "project" | "environment" | "secret",
) => {
  const grants = await AccessGrant.find({
    ...activeGrantFilter(userId),
    resourceType,
  }).select("resourceId projectId");
  return grants.map((grant) => grant.resourceId.toString());
};

export const hasActiveGrant = async (
  userId: string,
  resourceType: "organization" | "project" | "environment" | "secret",
  resourceId: string,
  permissions: string[] = [],
) => {
  const grants = await AccessGrant.find({
    ...activeGrantFilter(userId),
    resourceType,
    resourceId: new Types.ObjectId(resourceId),
  });
  return grants.some((grant) =>
    permissions.every((permission) => grant.permissions.includes(permission)),
  );
};
