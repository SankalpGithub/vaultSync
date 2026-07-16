import { z } from "zod";
import type {
  loginValidationSchema,
  signupValidationSchema,
  verifyOtpValidationSchema,
} from "../validation/examples.validation.js";
export type Iregister = z.infer<typeof signupValidationSchema>;

export type IverifyOtp = z.infer<typeof verifyOtpValidationSchema>;

export type Ilogin = z.infer<typeof loginValidationSchema>;
