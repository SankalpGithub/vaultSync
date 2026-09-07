import { Router } from "express";
import authRouter from "./auth.routes.js";
import orgRouter from "./org.routes.js";
import projectRouter from "./project.routes.js";
import secretRouter from "./secret.routes.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";
import { sendResponse } from "../utils/responseHandler.js";

const router: Router = Router();

router.get("/health", (_req, res) => {
  return sendResponse(res, {
    success: true,
    message: "Service is healthy",
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});

// /auth/*
// Description: Mounts authentication, account, and session routes.
router.use("/auth", authRouter);

// /org/*
// Description: Mounts organization routes for authenticated users.
// Validation: authenticated access token
router.use("/org", verifyAccessToken, orgRouter);

// /project/*
// Description: Mounts project routes for authenticated users.
// Validation: authenticated access token
router.use("/project", verifyAccessToken, projectRouter);

// /secret/*
// Description: Manage secrets
//validation: authenticatino access token
router.use("/secret", verifyAccessToken, secretRouter);

export default router;
