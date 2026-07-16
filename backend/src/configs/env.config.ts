import dotenv from "dotenv";
import envSchema from "../validation/env.validation.js";
dotenv.config();

export const env = envSchema.parse(process.env);
