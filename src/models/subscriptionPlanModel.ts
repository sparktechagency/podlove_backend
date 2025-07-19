import { model, Schema } from "mongoose";
import { DescriptionItem, SubscriptionPlanSchema } from "@schemas/subscriptionPlanSchema";

const DescriptionItemSchema = new Schema<DescriptionItem>(
  {
    key:     { type: String},
    details: { type: String},
  },
  { _id: true }
);

const SubscriptionPlanModel = new Schema<SubscriptionPlanSchema>({
  name: { type: String, required: true },
  description: {
      type: [DescriptionItemSchema],
      default: [],            
    },
  unitAmount: { type: String, required: true },
  interval: { type: String, enum: ["day", "week", "month", "year"], required: true },
  productId: { type: String, default: "" },
  priceId: { type: String, default: "" }
});

const SubscriptionPlan = model<SubscriptionPlanSchema>("SubscriptionPlan", SubscriptionPlanModel);
export default SubscriptionPlan;