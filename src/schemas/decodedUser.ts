import { Role } from "@shared/enums";

export type DecodedUser = {
  authId: string;
  userId: string;
  name: string;
  isVerified: boolean;
  isBlocked: boolean;
  email: string;
  role: Role;
};
