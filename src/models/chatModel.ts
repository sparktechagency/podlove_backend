import { Schema, model, Document, Types } from 'mongoose';

export interface IMessage {
  _id?: Types.ObjectId;
  content: string;
  sender: Types.ObjectId;
  timestamp: Date;
  messageType: 'text' | 'image' | 'file' | 'system';
  edited?: boolean;
  editedAt?: Date;
  replyTo?: Types.ObjectId;
}

export interface IChat extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  messages: IMessage[];
  chatType: 'private' | 'group';
  chatName?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: IMessage;
  isActive: boolean;
}

const MessageSchema = new Schema<IMessage>({
  content: { type: String, required: true, trim: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'file', 'system'], 
    default: 'text' 
  },
  edited: { type: Boolean, default: false },
  editedAt: { type: Date },
  replyTo: { type: Schema.Types.ObjectId }
});

const ChatSchema = new Schema<IChat>({
  participants: [{ 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }],
  messages: [MessageSchema],
  chatType: { 
    type: String, 
    enum: ['private', 'group'], 
    required: true 
  },
  chatName: { type: String, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastMessage: MessageSchema,
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes for better performance
ChatSchema.index({ participants: 1 });
ChatSchema.index({ 'messages.timestamp': -1 });
ChatSchema.index({ updatedAt: -1 });

export const Chat = model<IChat>('Chat', ChatSchema);