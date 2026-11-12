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
import {
  requirePermission,
  requireShareInvitationPermissions,
  rbacContexts,
} from "../middlewares/accessValidation.middleware.js";

const router: Router = Router();

router.post(
  "/",
  validateReq(sendShareInvitationValidationSchema),
  requireShareInvitationPermissions,
  asyncHandler(createShareInvitation),
);
router.get(
  "/invitations/received",
  requirePermission("share:invitation:list", rbacContexts.user),
  asyncHandler(getReceivedShareInvitations),
);
router.get(
  "/invitations/sent",
  requirePermission("share:invitation:list", rbacContexts.user),
  asyncHandler(getSentShareInvitations),
);
router.post(
  "/invitations/:invitationId/accept",
  requirePermission("share:invitation:respond", rbacContexts.user),
  asyncHandler(acceptShare),
);
router.post(
  "/invitations/:invitationId/reject",
  requirePermission("share:invitation:respond", rbacContexts.user),
  asyncHandler(rejectShare),
);
router.post(
  "/invitations/:invitationId/cancel",
  requirePermission("share:invitation:manage", rbacContexts.user),
  asyncHandler(cancelShare),
);
router.get(
  "/grants",
  requirePermission("share:grant:list", rbacContexts.user),
  asyncHandler(getShareGrants),
);
router.patch(
  "/grants/:grantId",
  requirePermission("share:grant:manage", rbacContexts.user),
  asyncHandler(updateShareGrantPermissions),
);
router.post(
  "/grants/:grantId/revoke",
  requirePermission("share:grant:manage", rbacContexts.user),
  asyncHandler(revokeShareGrantAccess),
);

export default router;
