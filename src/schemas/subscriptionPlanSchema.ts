import { Document } from "mongoose";

export type SubscriptionPlanSchema = Document & {
  name: string;
  description: {
    key: string;
    details: string;
  }[];
  unitAmount: string;
  interval: "day" | "week" | "month" | "year";
  productId: string;
  priceId: string;
};
