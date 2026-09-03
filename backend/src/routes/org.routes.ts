import { Router } from "express";
import { asyncHandler } from "../middlewares/asycHandler.middleware.js";
import { createOrg } from "../controllers/org.controller.js";
import { validateReq } from "../middlewares/reqValidator.middleware.js";
import { createOrgValidationSchema } from "../validation/routes.validation.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";

const router: Router = Router();

router.post(
  "/create",
  verifyAccessToken,
  validateReq(createOrgValidationSchema),
  asyncHandler(createOrg),
);

export default router;
