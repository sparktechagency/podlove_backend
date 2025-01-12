import { Document } from "mongoose";

export type PrivacySchema = Document & {
  text: string;
};
