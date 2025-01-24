import { PodcastStatus } from "@shared/enum";
import { Document, Types } from "mongoose";

export type PodcastSchema = Document & {
  primayUser: Types.ObjectId;
  participant1: Types.ObjectId;
  participant2: Types.ObjectId;
  participant3: Types.ObjectId;
  schedule: Date | null;
  selectedUser: Types.ObjectId | null;
  status: PodcastStatus;
  recordingUrl: String;
};
