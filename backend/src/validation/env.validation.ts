import { email, z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.string(),
  MONGO_URI: z.string(),
  JWT_SECRET: z.string(),
  NODE_ENV: z.enum(["development", "production", "test"]),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REFRESH_TOKEN: z.string(),
  GOOGLE_USER: z.string(),
  MJ_APIKEY_PUBLIC: z.string(),
  MJ_APIKEY_PRIVATE: z.string(),
});

export default schema;
