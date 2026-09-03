import { Types } from "mongoose";

export interface IOrgs {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  ownerId: Types.ObjectId;
  members?: Types.ObjectId[];
  visibility: "private" | "internal";
  lastModifiedBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrg {
  name: string;
  description?: string;
  ownerId: Types.ObjectId;
  visibility?: "private" | "internal";
}
