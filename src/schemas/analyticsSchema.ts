import { Document } from "mongoose";

export type AnalyticsSchema = Document & {
  month: string;
  year: number;
  income?: number;
  active?: number;
  cancel?: number;
};
