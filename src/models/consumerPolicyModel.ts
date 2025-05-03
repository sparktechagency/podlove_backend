import { Schema, Document, model, Model } from "mongoose";
import { logger } from "@shared/logger";

type ConsumerPolicySchema = Document & {
  text: string;
};

const consumerPolicySchema = new Schema<ConsumerPolicySchema>({
  text: {
    type: String,
  },
});

consumerPolicySchema.statics.findOrCreate = async function (): Promise<void> {
  const consumerPolicy = await this.findOne();
  if (!consumerPolicy) {
    await this.create({ text: "Consumer Policy" });
    logger.info("Consumer Policy added Successfully!");
  } else {
    logger.info("Consumer Policy exists!");
  }
};

type ConsumerPolicyModel = Model<ConsumerPolicySchema> & {
  findOrCreate(): Promise<void>;
};

const ConsumerPolicy = model<ConsumerPolicySchema, ConsumerPolicyModel>("ConsumerPolicy", consumerPolicySchema);
export default ConsumerPolicy;
