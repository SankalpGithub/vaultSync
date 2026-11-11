import { Router } from "express";
import { asyncHandler } from "../middlewares/asycHandler.middleware.js";
import {
  createProject,
  createProjectEnvironment,
  deleteProjectEnvironment,
  deleteProject,
  listProjects,
  renameProjectEnvironment,
  updateProject,
} from "../controllers/project.controller.js";
import { validateReq } from "../middlewares/reqValidator.middleware.js";
import {
  createProjectEnvironmentValidationSchema,
  createProjectValidationSchema,
  updateProjectValidationSchema,
  deleteProjectEnvironmentValidationSchema,
  renameProjectEnvironmentValidationSchema,
} from "../validation/routes.validation.js";

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

router.patch(
  "/:projectId",
  validateReq(updateProjectValidationSchema),
  asyncHandler(updateProject),
);

// POST /:projectId/environments
// Description: Adds an environment to a project owned by the authenticated user.
router.post(
  "/:projectId/environments",
  validateReq(createProjectEnvironmentValidationSchema),
  asyncHandler(createProjectEnvironment),
);

// PATCH /:projectId/environments/:environmentId
// Description: Renames a non-default environment in an owned project.
router.patch(
  "/:projectId/environments/:environmentId",
  validateReq(renameProjectEnvironmentValidationSchema),
  asyncHandler(renameProjectEnvironment),
);

// DELETE /:projectId/environments/:environmentId
// Description: Deletes a non-default environment in an owned project.
router.delete(
  "/:projectId/environments/:environmentId",
  validateReq(deleteProjectEnvironmentValidationSchema),
  asyncHandler(deleteProjectEnvironment),
);

// DELETE /:projectId
// Description: Deletes a project by its ID.
// Parameters: projectId
router.delete("/:projectId", asyncHandler(deleteProject));

export default router;
