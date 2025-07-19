import { Document } from "mongoose";

export interface DescriptionItem {
  key: string;
  details: string;
}

export type PlanSchema = Document & {
  name: string;
  description: DescriptionItem[];    
  unitAmount: number;
  interval: "day" | "week" | "month" | "year";
  productId: string;
  priceId: string;
};
