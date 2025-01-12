import { Schema, model } from "mongoose";
import { PrivacySchema } from "@schemas/privacySchema";

const privacySchema = new Schema<PrivacySchema>({
  text: {
    type: String,
  },
});

const Privacy = model<PrivacySchema>("Privacy", privacySchema);
export default Privacy;
