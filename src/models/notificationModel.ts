import {Document, Schema, model, Types} from "mongoose";

type NotificationSchema = Document & {
    type: string;
    user: Types.ObjectId;
    message: string;
    read:Boolean
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
    read:{
        type: Boolean,
        default: false
    }
},
    {timestamps: true},
);

const Notification = model<NotificationSchema>("Notification", notificationSchema);
export default Notification;
