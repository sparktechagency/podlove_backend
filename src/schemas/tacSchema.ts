import { Document } from "mongoose";

export type TaCSchema = Document & {
  text: string;
};
