import { Schema, model } from "mongoose";
import { DescriptionItem, PlanSchema } from "@schemas/planSchema";

const DescriptionItemSchema = new Schema<DescriptionItem>(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }          // prevent auto‐generation of an _id on each subdocument
);

const planSchema = new Schema<PlanSchema>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: [DescriptionItemSchema],  // ← array of sub‐docs
      default: [],                    // initialize to empty array if none provided
    },

    unitAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    interval: {
      type: String,
      required: true,
      enum: ["day", "week", "month", "year"],
    },

    productId: {
      type: String,
      required: true,
      default: "",
    },

    priceId: {
      type: String,
      required: true,
      default: "",
    },
  },
  {
    timestamps: true, 
  }
);

const Plan = model<PlanSchema>("Plan", planSchema);
export default Plan;
