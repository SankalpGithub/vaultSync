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
import {
  requirePermission,
  rbacContexts,
} from "../middlewares/accessValidation.middleware.js";

const router: Router = Router();

// GET /
// Description: Lists the projects available to the authenticated user.
// Validation: authenticated access token
router.get(
  "/",
  requirePermission("project:list", rbacContexts.user),
  asyncHandler(listProjects),
);

// POST /create
// Description: Creates a project in an organization.
// Validation: project name, organization ID
router.post(
  "/create",
  validateReq(createProjectValidationSchema),
  requirePermission("project:create", rbacContexts.organizationBody()),
  asyncHandler(createProject),
);

router.patch(
  "/:projectId",
  validateReq(updateProjectValidationSchema),
  requirePermission("project:update", rbacContexts.projectParam()),
  asyncHandler(updateProject),
);

// POST /:projectId/environments
// Description: Adds an environment when the authenticated user's role permits it.
router.post(
  "/:projectId/environments",
  validateReq(createProjectEnvironmentValidationSchema),
  requirePermission(
    "environment:create",
    rbacContexts.projectParam(),
  ),
  asyncHandler(createProjectEnvironment),
);

// PATCH /:projectId/environments/:environmentId
// Description: Renames a non-default environment when permitted.
router.patch(
  "/:projectId/environments/:environmentId",
  validateReq(renameProjectEnvironmentValidationSchema),
  requirePermission(
    "environment:rename",
    rbacContexts.environmentParam(),
  ),
  asyncHandler(renameProjectEnvironment),
);

// DELETE /:projectId/environments/:environmentId
// Description: Deletes a non-default environment when permitted.
router.delete(
  "/:projectId/environments/:environmentId",
  validateReq(deleteProjectEnvironmentValidationSchema),
  requirePermission(
    "environment:delete",
    rbacContexts.environmentParam(),
  ),
  asyncHandler(deleteProjectEnvironment),
);

// DELETE /:projectId
// Description: Deletes a project by its ID.
// Parameters: projectId
router.delete(
  "/:projectId",
  requirePermission("project:delete", rbacContexts.projectParam()),
  asyncHandler(deleteProject),
);

export default router;
