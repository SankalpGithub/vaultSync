import { Router } from "express";
import { asyncHandler } from "../middlewares/asycHandler.middleware.js";
import {
  createSecret,
  deleteSecret,
  getSecretValue,
  listSecrets,
  updateSecret,
} from "../controllers/secret.controller.js";
import { validateReq } from "../middlewares/reqValidator.middleware.js";
import {
  createSecretValidationSchema,
  updateSecretValidationSchema,
} from "../validation/routes.validation.js";
import {
  requirePermission,
  requireSecretListPermission,
  requireSecretUpdatePermissions,
  rbacContexts,
} from "../middlewares/accessValidation.middleware.js";

const router: Router = Router();

// GET /
// Description: Lists the secrets available to the authenticated user.
// Validation: authenticated access token
router.get(
  "/",
  requireSecretListPermission,
  asyncHandler(listSecrets),
);
router.get(
  "/:secretId",
  requirePermission("secret:value:read", rbacContexts.secretParam()),
  asyncHandler(getSecretValue),
);
router.patch(
  "/:secretId",
  validateReq(updateSecretValidationSchema),
  requireSecretUpdatePermissions,
  asyncHandler(updateSecret),
);

// DELETE /:secretId
// Description: Deletes an secret by its ID.
// Parameters: secretId
// Validation: authenticated access token
router.delete(
  "/:secretId",
  requirePermission("secret:delete", rbacContexts.secretParam()),
  asyncHandler(deleteSecret),
);

// POST /create
// Description: Creates secrets for the authenticated user.
// Validation: authenticated access token, secret details
router.post(
  "/create",
  validateReq(createSecretValidationSchema),
  requirePermission("secret:create", rbacContexts.secretCreate),
  asyncHandler(createSecret),
);

export default router;
