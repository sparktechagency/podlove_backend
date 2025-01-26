import { DecodedUser, DecodedAdmin } from "@schemas/decodedUser";

declare global {
  namespace Express {
    interface Request {
      user: DecodedUser;
      admin: DecodedAdmin;
      files?: fileUpload.FileArray | null | undefined;
    }
  }
}
