export interface IUser {
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  isEmailVerified?: boolean;
}
