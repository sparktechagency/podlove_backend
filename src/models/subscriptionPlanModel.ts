import { model, Schema } from "mongoose";
import { SubscriptionPlanSchema } from "@schemas/subscriptionPlanSchema";


const SubscriptionPlanModel = new Schema<SubscriptionPlanSchema>({
  name: { type: String, required: true },
  description: [
    {
      key: { type: String, required: true },
      details: { type: String, required: true }
    }
  ],
  unitAmount: { type: String, required: true },
  interval: { type: String, enum: ["day", "week", "month", "year"], required: true },
  productId: { type: String, default: "" },
  priceId: { type: String, default: "" }
});

const SubscriptionPlan = model<SubscriptionPlanSchema>("SubscriptionPlan", SubscriptionPlanModel);
export default SubscriptionPlan;