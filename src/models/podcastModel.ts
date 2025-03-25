import { Document, Types, Schema, model } from "mongoose";
import { PodcastStatus, PodcastType } from "@shared/enums";

export type PodcastSchema = Document & {
  type: PodcastType;
  primaryUser: Types.ObjectId;
  participants: Types.ObjectId[];
  schedule: {
    date: string;
    day: string;
    time: string;
  };
  selectedUser: Types.ObjectId | null;
  status: PodcastStatus;
  recordingUrl: string;
  isFinished: boolean;
};

const podcastSchema = new Schema<PodcastSchema>({
  type: {
    type: String,
    enum: PodcastType,
    required: true,
  },
  primaryUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participants: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  schedule: {
    date: {
      type: String,
      default: "",
    },
    day: {
      type: String,
      default: "",
    },
    time: {
      type: String,
      default: "",
    },
  },
  selectedUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  status: {
    type: String,
    enum: PodcastStatus,
    default: PodcastStatus.NOT_SCHEDULED,
  },
  recordingUrl: {
    type: String,
    default: "",
  },
  isFinished: {
    type: Boolean,
    default: false,
  }
});

const Podcast = model<PodcastSchema>("Podcast", podcastSchema);
export default Podcast;
