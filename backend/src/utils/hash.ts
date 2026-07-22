import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 10;

export const createHash = async (value: string) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(value, salt);

  return hash;
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const compareHash = async (plainText: string, hashText: string) => {
  return await bcrypt.compare(plainText, hashText);
};
