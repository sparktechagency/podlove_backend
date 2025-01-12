import { Role } from "@shared/enum";
import { Document } from "mongoose";

export type AuthSchema = Document & {
  email: string;
  password: string;
  role: Role;
  verificationOTP: string;
  verificationOTPExpiredAt: Date | null;
  recoveryOTP: string;
  recoveryOTPExpiredAt: Date | null;
  isVerified: boolean;
  isBlocked: boolean;
};
