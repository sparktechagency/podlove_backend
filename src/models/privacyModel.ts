import { Schema, Document, model, Model } from "mongoose";
import { logger } from "@shared/logger";

type PrivacySchema = Document & {
  text: string;
};

const privacySchema = new Schema<PrivacySchema>({
  text: {
    type: String,
  },
});

privacySchema.statics.findOrCreate = async function (): Promise<void> {
  const privacy = await this.findOne();
  if(!privacy) {
    await this.create({text: "Privacy Policy"});
    logger.info("Privacy Policy added successfully!");
  } else {
    logger.info("Privacy Policy exists!");
  }
}

type PrivacyModel = Model<PrivacySchema> & {
  findOrCreate(): Promise<void>;
}


const Privacy = model<PrivacySchema, PrivacyModel>("Privacy", privacySchema);
export default Privacy;