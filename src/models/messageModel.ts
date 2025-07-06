import { Schema, model, Document, Types } from "mongoose";

type MessageDoc = Document & {
  chatRoom: string;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  text: string;
  createdAt: Date;
}
// export interface MessageDoc extends Document {
//   chatRoom: string;
//   sender: Types.ObjectId;
//   receiver: Types.ObjectId;
//   text: string;
//   createdAt: Date;
// }

const messageSchema = new Schema<MessageDoc>({
  chatRoom: { type: String, required: true, index: true },
  sender:   { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text:     { type: String, required: true },
  createdAt:{ type: Date, default: Date.now },
});

export default model<MessageDoc>("Message", messageSchema);
