import { Document } from "mongoose";

export type FaqSchema = Document & {
  question: string;
  answer: string;
};
