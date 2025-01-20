import { AdminAccess, AdminRole } from "@shared/enum";
import { Document } from "mongoose";

export type AdministratorSchema = Document & {
  name: string;
  email: string;
  contact: string;
  password: string;
  role: AdminRole;
  access: AdminAccess[];
};
