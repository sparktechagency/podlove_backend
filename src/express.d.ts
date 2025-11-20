import { DecodedUser } from "@models/userModel";
import { DecodedAdmin } from "@models/adminModel";
import fileUpload from "express-fileupload";
import { ClientSession } from "mongoose";


declare global {
  namespace Express {
    interface Request {
      user: DecodedUser;
      admin: DecodedAdmin;
      files?: fileUpload.FileArray | null | undefined;
      session: ClientSession;
    }
  }
}
