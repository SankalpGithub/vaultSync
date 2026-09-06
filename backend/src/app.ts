import express from "express";
import type { Express } from "express";
import { httpLoggerMiddleware } from "./middlewares/reqLogger.middleware.js";
import { errorMiddleware } from "./middlewares/errorHandler.middleware.js";
import helmet from "helmet";
import router from "./routes/root.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "node:process";

const app: Express = express();
const frontendUrl = env.FRONTEND_URL;

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(httpLoggerMiddleware);

app.use("/api/v1", router);
app.use(errorMiddleware);

export default app;
