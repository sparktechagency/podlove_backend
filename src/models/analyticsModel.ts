import { AnalyticsSchema } from "@schemas/analyticsSchema";
import { Months } from "@shared/enums";
import { model, Schema } from "mongoose";

const analyticsSchema = new Schema<AnalyticsSchema>({
  month: {
    type: String,
    enum: Months,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  income: {
    type: Number,
  },
  active: {
    type: Number,
  },
  cancel: {
    type: Number,
  },
});

const Analytics = model<AnalyticsSchema>("Analytics", analyticsSchema);
export default Analytics;
