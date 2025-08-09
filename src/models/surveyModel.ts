import { SurveySchema } from "@schemas/surveySchema";
import { Schema, model, Types } from "mongoose";

const surveySchema = new Schema<SurveySchema>(
  {
    user: { type: Schema.Types.ObjectId },
    first: { type: Number },
    second: { type: Number },
    third: { type: String },
    fourth: { type: Number },
    fifth: { type: Number },
    six: { type: Number },
    seven: { type: String },
    eight: { type: Number },
    nine: { type: Number },
    ten: { type: String },
    eleven: { type: Number },
    twelve: { type: Number },
    thirteen: { type: String },
    fourteen: { type: Number },
    fifteen: { type: Boolean },
    sixteen: { type: String },
    seventeen: { type: String },
    eighteen: { type: String },
    nineteen: { type: String },
  },
  {
    timestamps: true,
  }
);

const Survey = model<SurveySchema>("Survey", surveySchema);
export default Survey;
