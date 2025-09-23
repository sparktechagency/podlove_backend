import { Document, Schema, model, Types } from "mongoose";
interface MessageItem {
  title: string;
  description: string;
}
type NotificationSchema = Document & {
  type: string;
  user: Types.ObjectId;
  message: MessageItem[];
  read: Boolean
};
const MessageItemSchema = new Schema<MessageItem>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);


const notificationSchema = new Schema<NotificationSchema>({
  type: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: [MessageItemSchema],
    required: true,
    validate: [(arr: MessageItem[]) => arr.length > 0, "At least one message item is required"],
  },
  read: {
    type: Boolean,
    default: false
  }
},
  { timestamps: true },
);

const Notification = model<NotificationSchema>("Notification", notificationSchema);
export default Notification;
