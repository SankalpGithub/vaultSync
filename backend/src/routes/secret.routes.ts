import { Router } from "express";
import { asyncHandler } from "../middlewares/asycHandler.middleware.js";
import {
  createSecret,
  deleteSecret,
  getSecretValue,
  listSecrets,
} from "../controllers/secret.controller.js";
import { validateReq } from "../middlewares/reqValidator.middleware.js";
import { createSecretValidationSchema } from "../validation/routes.validation.js";

const router: Router = Router();

// GET /
// Description: Lists the secrets available to the authenticated user.
// Validation: authenticated access token
router.get("/", asyncHandler(listSecrets));
router.get("/:secretId", asyncHandler(getSecretValue));

// DELETE /:secretId
// Description: Deletes an secret by its ID.
// Parameters: secretId
// Validation: authenticated access token
router.delete("/:secretId", asyncHandler(deleteSecret));

// POST /create
// Description: Creates secrets for the authenticated user.
// Validation: authenticated access token, secret details
router.post(
  "/create",
  validateReq(createSecretValidationSchema),
  asyncHandler(createSecret),
);

export default router;
