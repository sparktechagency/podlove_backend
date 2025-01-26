import { Schema, model } from "mongoose";
import { AdminAccess } from "@shared/enums";
import { AdministratorSchema } from "@schemas/administratorSchema";

const administratorSchema = new Schema<AdministratorSchema>({
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ""
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  contact: {
    type: String,
    required: true
  },
  address: {
    type: String,
    default: ""
  },
  password: {
    type: String,
    required: true
  },
  // role: {
  //   type: String,
  //   required: true,
  //   enum: AdminRole,
  // },
  access: {
    type: String,
    required: true,
    enum: Object.values(AdminAccess)
  },
  recoveryOTP: {
    type: String
  },
  recoveryOTPExpiredAt: {
    type: Date
  }
});

const Administrator = model<AdministratorSchema>("Administrator", administratorSchema);
export default Administrator;
