import { Router } from "express";
import { asyncHandler } from "../middlewares/asycHandler.middleware.js";
import {
  createProject,
  deleteProject,
} from "../controllers/project.controller.js";
import { validateReq } from "../middlewares/reqValidator.middleware.js";
import { createProjectValidationSchema } from "../validation/routes.validation.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";

const router: Router = Router();

/**
 * POST /project/create
 * Create a new project
 * Requires: name (string), orgId (MongoDB ObjectId)
 */
router.post(
  "/create",
  validateReq(createProjectValidationSchema),
  asyncHandler(createProject),
);

/**
 * DELETE /project/:projectId
 * Delete a project by ID
 */
router.delete("/:projectId", asyncHandler(deleteProject));

export default router;
