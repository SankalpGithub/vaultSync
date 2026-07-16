import express from "express";
import type { Express } from "express";
import { httpLoggerMiddleware } from "./middlewares/reqLogger.middleware.js";
import { errorMiddleware } from "./middlewares/errorHandler.middleware.js";
import helmet from "helmet";
import router from "./routes/root.routes.js";
import cookieParser from "cookie-parser";

const app: Express = express();

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(httpLoggerMiddleware);

app.use("/api/v1", router);
app.use(errorMiddleware);

export default app;
