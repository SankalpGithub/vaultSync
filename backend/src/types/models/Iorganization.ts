import Types from "mongoose";

export interface IOrgs {
  _id: Types.ObjectId;
  name: string;
  ownerId: Types.ObjectId;
}

export interface ICreateOrg {
  name: string;
  ownerId: Types.ObjectId;
}
