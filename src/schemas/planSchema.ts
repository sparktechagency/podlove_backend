import { Document } from "mongoose";

export type PlanSchema = Document & {
  name: string;
  description: string;
  unitAmount: number;
  interval: "day" | "week" | "month" | "year";
  productId: string;
  priceId: string;
};
