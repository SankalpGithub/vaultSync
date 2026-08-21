import { Router } from "express";
import { asyncHandler } from "../middlewares/asycHandler.middleware.js";
import { createOrg } from "../controllers/org.controller.js";

const router: Router = Router();

router.post("/create-org", asyncHandler(createOrg));
