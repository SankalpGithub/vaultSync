import mongoose from "mongoose";
import { logger } from "../utils/logger.js";
import { env } from "./env.config.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(env.MONGO_URI as string);
    logger.info({
      message: `Mongodb connected !! DB HOST: ${connectionInstance.connection.host}`,
    });
  } catch (error) {
    logger.error("DB connection error: ", error);
    process.exit(1);
  }
};

export default connectDB;
