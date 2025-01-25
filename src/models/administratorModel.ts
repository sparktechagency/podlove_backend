import { Schema, model } from "mongoose";
import { AdminAccess, AdminRole } from "@shared/enums";
import { AdministratorSchema } from "@schemas/administratorSchema";

const administratorSchema = new Schema<AdministratorSchema>({
  name: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: AdminRole,
  },
  access: {
    type: [String],
    required: true,
    enum: Object.values(AdminAccess),
  },
});

const Administrator = model<AdministratorSchema>("Administrator", administratorSchema);
export default Administrator;
