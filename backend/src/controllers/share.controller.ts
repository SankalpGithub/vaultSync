import type { Response } from "express";
import type { AuthRequest } from "../types/reqRes.js";
import { AppError } from "../utils/appError.js";
import { sendResponse } from "../utils/responseHandler.js";
import {
  handleShareInvitation,
  type ISendShareInvitationRequest,
} from "../services/sharing/share.service.js";
import {
  acceptShareInvitation,
  cancelShareInvitation,
  getReceivedInvitations,
  getSentInvitations,
  listGrants,
  rejectShareInvitation,
  revokeShareGrant,
  updateShareGrant,
} from "../services/sharing/share.service.js";

//send invitation controller
export const createShareInvitation = async (
  req: AuthRequest,
  res: Response,
) => {
  if (!req.userId) {
    throw new AppError("User not authenticated", 401);
  }

  const request: ISendShareInvitationRequest = {
    ...req.body,
    sharerId: req.userId,
  };

  const result = await handleShareInvitation(request);
  sendResponse(res, result);
};

export const getReceivedShareInvitations = async (
  req: AuthRequest,
  res: Response,
) => {
  if (!req.userId) throw new AppError("User not authenticated", 401);
  sendResponse(
    res,
    await getReceivedInvitations(
      req.userId,
      req.query.status as string | undefined,
    ),
  );
};

export const getSentShareInvitations = async (
  req: AuthRequest,
  res: Response,
) => {
  if (!req.userId) throw new AppError("User not authenticated", 401);
  sendResponse(
    res,
    await getSentInvitations(
      req.userId,
      req.query.status as string | undefined,
    ),
  );
};

export const acceptShare = async (req: AuthRequest, res: Response) => {
  if (!req.userId) throw new AppError("User not authenticated", 401);
  const token =
    typeof req.query.token === "string" ? req.query.token : undefined;
  sendResponse(
    res,
    await acceptShareInvitation(
      req.params.invitationId as string,
      req.userId,
      token,
    ),
  );
};

export const rejectShare = async (req: AuthRequest, res: Response) => {
  if (!req.userId) throw new AppError("User not authenticated", 401);
  sendResponse(
    res,
    await rejectShareInvitation(req.params.invitationId as string, req.userId),
  );
};

export const cancelShare = async (req: AuthRequest, res: Response) => {
  if (!req.userId) throw new AppError("User not authenticated", 401);
  sendResponse(
    res,
    await cancelShareInvitation(req.params.invitationId as string, req.userId),
  );
};

export const getShareGrants = async (req: AuthRequest, res: Response) => {
  if (!req.userId) throw new AppError("User not authenticated", 401);
  sendResponse(
    res,
    await listGrants(
      req.userId,
      req.query.resourceType as string | undefined,
      req.query.resourceId as string | undefined,
    ),
  );
};

export const updateShareGrantPermissions = async (
  req: AuthRequest,
  res: Response,
) => {
  if (!req.userId) throw new AppError("User not authenticated", 401);
  sendResponse(
    res,
    await updateShareGrant(req.params.grantId as string, req.userId, req.body),
  );
};

export const revokeShareGrantAccess = async (
  req: AuthRequest,
  res: Response,
) => {
  if (!req.userId) throw new AppError("User not authenticated", 401);
  sendResponse(
    res,
    await revokeShareGrant(req.params.grantId as string, req.userId),
  );
};
