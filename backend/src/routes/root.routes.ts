import { Router } from "express";
import authRouter from "./auth.routes.js";
import orgRouter from "./org.routes.js";
import projectRouter from "./project.routes.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";

const router: Router = Router();

router.use("/auth", authRouter);
router.use("/org", verifyAccessToken, orgRouter);
router.use("/project", verifyAccessToken, projectRouter);

export default router;
