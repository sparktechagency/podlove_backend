import { Document, Types } from "mongoose";

export type SurveySchema = Document & {
  user: Types.ObjectId;
  first: number;
  second: number;
  third: string;
  fourth: number;
  fifth: number;
  six: number;
  seven: string;
  eight: number
  nine: number;
  ten: string;
  eleven: number;
  twelve: number;
  thirteen: string;
  fourteen: number;
  fifteen: boolean;
  sixteen: string;
  seventeen: string;
  eighteen: string;
  nineteen: string;
};
