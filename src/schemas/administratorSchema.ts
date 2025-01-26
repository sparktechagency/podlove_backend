import { AdminAccess } from "@shared/enums";
import { Document } from "mongoose";

export type AdministratorSchema = Document & {
  name: string;
  avatar: string;
  email: string;
  address: string;
  contact: string;
  password: string;
  access: AdminAccess;
  recoveryOTP: string;
  recoveryOTPExpiredAt: Date | null;
  // role: AdminRole;
};
