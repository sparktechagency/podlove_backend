import { Document, Types } from "mongoose";

export type SupportSchema = Document & {
  user: Types.ObjectId;
  userName: string;
  userAvatar: string;
  description: string;
  date: Date;
  reply: string;
  category: string;
};
