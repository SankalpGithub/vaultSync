import { Router } from "express";
import { asyncHandler } from "../middlewares/asycHandler.middleware.js";
import {
  createProject,
  deleteProject,
  listProjects,
} from "../controllers/project.controller.js";
import { validateReq } from "../middlewares/reqValidator.middleware.js";
import { createProjectValidationSchema } from "../validation/routes.validation.js";

const router: Router = Router();

// GET /
// Description: Lists the projects available to the authenticated user.
// Validation: authenticated access token
router.get("/", asyncHandler(listProjects));

// POST /create
// Description: Creates a project in an organization.
// Validation: project name, organization ID
router.post(
  "/create",
  validateReq(createProjectValidationSchema),
  asyncHandler(createProject),
);

// DELETE /:projectId
// Description: Deletes a project by its ID.
// Parameters: projectId
router.delete("/:projectId", asyncHandler(deleteProject));

export default router;
