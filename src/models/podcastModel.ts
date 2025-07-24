import { Document, Types, Schema, model } from "mongoose";
import { PodcastStatus, PodcastType } from "@shared/enums";

export type PodcastSchema = Document & {
  // type: PodcastType;
  primaryUser: Types.ObjectId;
  participants:   { user: Types.ObjectId; score: number }[];
  schedule: {
    date: string;
    day: string;
    time: string;
  };
  selectedUser: {user: Types.ObjectId }[]| [];
  status: PodcastStatus;
  recordingUrl: string;
  score: number;
  createdAt?: Date;
  notificationSent: Boolean,
};

const podcastSchema = new Schema<PodcastSchema>({
  // type: {
  //   type: String,
  //   enum: PodcastType,
  //   required: true,
  // },
  primaryUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participants: [
    {
    user:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true }
  }
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
  selectedUser: [
    {
    user: {type: Schema.Types.ObjectId, ref: "User", default:""},
    }
  ],
  status: {
    type: String,
    enum: PodcastStatus,
    default: PodcastStatus.NOT_SCHEDULED,
  },
  recordingUrl: {
    type: String,
    default: "",
  },
  score: {
    type: Number,
    default: 0,
  },
  notificationSent: { type: Boolean, default: false },
});

const Podcast = model<PodcastSchema>("Podcast", podcastSchema);
export default Podcast;
