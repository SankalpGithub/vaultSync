import { Router } from "express";
import { asyncHandler } from "../middlewares/asycHandler.middleware.js";
import { validateReq } from "../middlewares/reqValidator.middleware.js";
import { sendShareInvitationValidationSchema } from "../validation/routes.validation.js";
import {
  acceptShare,
  cancelShare,
  createShareInvitation,
  getReceivedShareInvitations,
  getSentShareInvitations,
  getShareGrants,
  rejectShare,
  revokeShareGrantAccess,
  updateShareGrantPermissions,
} from "../controllers/share.controller.js";

const router: Router = Router();

router.post(
  "/",
  validateReq(sendShareInvitationValidationSchema),
  asyncHandler(createShareInvitation),
);
router.get("/invitations/received", asyncHandler(getReceivedShareInvitations));
router.get("/invitations/sent", asyncHandler(getSentShareInvitations));
router.post("/invitations/:invitationId/accept", asyncHandler(acceptShare));
router.post("/invitations/:invitationId/reject", asyncHandler(rejectShare));
router.post("/invitations/:invitationId/cancel", asyncHandler(cancelShare));
router.get("/grants", asyncHandler(getShareGrants));
router.patch("/grants/:grantId", asyncHandler(updateShareGrantPermissions));
router.post("/grants/:grantId/revoke", asyncHandler(revokeShareGrantAccess));

export default router;
