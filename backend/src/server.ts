import { env } from "./configs/env.config.js";
import app from "./app.js";
import { logger } from "./utils/logger.js";
import { asyncHandler } from "./middlewares/asycHandler.middleware.js";
import connectDB from "./configs/db.config.js";

const port = env.PORT;

connectDB()
  .then(() => {
    app.listen(port, () => {
      logger.info(`Server is running on port: ${port}`, {
        port,
        environment: env.NODE_ENV || "development",
      });
    });
  })
  .catch((err) => {
    logger.error("DB connection error: ", err);
  });
