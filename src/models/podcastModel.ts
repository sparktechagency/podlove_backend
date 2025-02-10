import { Document, Types, Schema, model } from "mongoose";
import { PodcastStatus } from "@shared/enums";

export type PodcastSchema = Document & {
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
};

const podcastSchema = new Schema<PodcastSchema>({
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
});

const Podcast = model<PodcastSchema>("Podcast", podcastSchema);
export default Podcast;
