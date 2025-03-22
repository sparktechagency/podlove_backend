import {Document, Schema, model, Types} from "mongoose";

type NotificationSchema = Document & {
    type: string;
    user: Types.ObjectId;
    message: string;
};

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
        type: String,
        required: true,
    },
},
    {timestamps: true},
);

const Notification = model<NotificationSchema>("Notification", notificationSchema);
export default Notification;
