import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const createHash = async (value: string) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(value, salt);

  return hashedPassword;
};

export const compareHash = async (plainText: string, hashText: string) => {
  return await bcrypt.compare(plainText, hashText);
};
