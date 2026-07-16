import { Router } from "express";
import authRouter from "./auth.routes.js";

const router: Router = Router();

router.use("/auth", authRouter);

export default router;
