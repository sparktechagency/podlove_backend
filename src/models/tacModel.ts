import { Schema, Document, model, Model } from "mongoose";
import { logger } from "@shared/logger";

type TaCSchema = Document & {
  text: string;
};

const tacSchema = new Schema<TaCSchema>({
  text: {
    type: String,
  },
});

tacSchema.statics.findOrCreate = async function (): Promise<void> {
  const tac = await this.findOne();
  if (!tac) {
    await this.create({text: "Terms and Conditions"});
    logger.info("Terms and conditions added Successfully!");
  } else {
    logger.info("Terms and conditions exists!");
  }
}

type TaCModel = Model<TaCSchema> & {
  findOrCreate(): Promise<void>;
}

const TaC = model<TaCSchema, TaCModel>("TaC", tacSchema);
export default TaC;
