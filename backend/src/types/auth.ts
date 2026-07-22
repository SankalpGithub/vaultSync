import { z } from "zod";
import type {
  loginValidationObject,
  signupValidationObject,
  verifyOtpValidationObject,
} from "../validation/examples.validation.js";
export type Iregister = z.infer<typeof signupValidationObject>;

export type IverifyOtp = z.infer<typeof verifyOtpValidationObject>;

export type Ilogin = z.infer<typeof loginValidationObject>;
