import { Document } from "mongoose";

export interface DescriptionItem {
  key: string;
  details: string;
}

export type SubscriptionPlanSchema = Document & {
  name: string;
  description: DescriptionItem[];    
  unitAmount: string;
  interval: "day" | "week" | "month" | "year";
  productId: string;
  priceId: string;
};


// export type SubscriptionPlanSchema = Document & {
//   name: string;
//   description: {
//     key: string;
//     details: string;
//   }[];
//   unitAmount: string;
//   interval: "day" | "week" | "month" | "year";
//   productId: string;
//   priceId: string;
// };
