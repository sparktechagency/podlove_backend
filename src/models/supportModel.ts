import { Schema, model } from "mongoose";
import { SupportSchema } from "@schemas/supportSchema";

const supportSchema = new Schema<SupportSchema>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userAvatar: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  reply: {
    type: String,
    default: ""
  }
});

const Support = model<SupportSchema>("Support", supportSchema);
export default Support;
