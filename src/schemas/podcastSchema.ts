import { PodcastStatus } from "@shared/enums";
import { Document, Types } from "mongoose";

export type PodcastSchema = Document & {
  primaryUser: Types.ObjectId;
  participant1: Types.ObjectId;
  participant2: Types.ObjectId;
  participant3: Types.ObjectId;
  schedule: {
    date: string;
    day: string;
    time: string;
  };
  selectedUser: Types.ObjectId | null;
  status: PodcastStatus;
  recordingUrl: String;
};
