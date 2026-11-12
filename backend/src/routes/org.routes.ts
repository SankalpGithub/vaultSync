import { Router } from "express";
import { asyncHandler } from "../middlewares/asycHandler.middleware.js";
import {
  createOrg,
  deleteOrganization,
  listOrganizations,
} from "../controllers/org.controller.js";
import { validateReq } from "../middlewares/reqValidator.middleware.js";
import { createOrgValidationSchema } from "../validation/routes.validation.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import {
  requirePermission,
  rbacContexts,
} from "../middlewares/accessValidation.middleware.js";

const router: Router = Router();

// GET /
// Description: Lists the organizations available to the authenticated user.
// Validation: authenticated access token
router.get(
  "/",
  requirePermission("organization:list", rbacContexts.user),
  asyncHandler(listOrganizations),
);

// DELETE /:organizationId
// Description: Deletes an organization by its ID.
// Parameters: organizationId
// Validation: authenticated access token
router.delete(
  "/:organizationId",
  requirePermission(
    "organization:delete",
    rbacContexts.organizationParam(),
  ),
  asyncHandler(deleteOrganization),
);

// POST /create
// Description: Creates an organization for the authenticated user.
// Validation: authenticated access token, organization details
router.post(
  "/create",
  verifyAccessToken,
  validateReq(createOrgValidationSchema),
  requirePermission("organization:create", rbacContexts.user),
  asyncHandler(createOrg),
);

export default router;
