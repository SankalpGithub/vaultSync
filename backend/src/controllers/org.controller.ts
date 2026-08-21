import { handleCreateOrg } from "../services/organizations/createOrg.service.js";
import type { ResponseData } from "../types/reqRes.js";
import type { Request, Response } from "express";
import { sendResponse } from "../utils/responseHandler.js";

/**
 * @route   POST /create-org
 * @desc    Create a new organization
 * @access  secure
 */
export const createOrg = async (req: Request, res: Response) => {
  const { organizationName, organizationOwner } = req.body;
  const result: ResponseData = await handleCreateOrg(
    organizationName,
    organizationOwner,
  );
  sendResponse(res, result);
};

/**
 * @route   POST /delete-org
 * @desc    Create a new organization
 * @access  secure
 */
export const DeleteOrg = async (req: Request, res: Response) => {
  const { name, owner, email } = req.body;
  const result: ResponseData = await handleCreateOrg(name, owner);
  sendResponse(res, result);
};
