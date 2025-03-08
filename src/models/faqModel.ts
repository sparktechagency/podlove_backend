import {Document, Schema, model} from "mongoose";

type FaqSchema = Document & {
  question: string;
  answer: string;
};

const faqSchema = new Schema<FaqSchema>({
  question: {
    type: String,
  },
  answer: {
    type: String,
  },
});

const Faq = model<FaqSchema>("Faq", faqSchema);
export default Faq;
