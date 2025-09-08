import { Document, Types, Schema, model } from "mongoose";
import { PodcastStatus, PodcastType } from "@shared/enums";
import { IRoomCode } from "src/podcast/podcast.interface";

const RoomCodeSchema: Schema = new Schema<IRoomCode>({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  room_id: { type: String, required: true, index: true },
  role: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  created_at: { type: String, required: true },
  updated_at: { type: String, required: true },
});

export type PodcastSchema = Document & {
  // type: PodcastType;
  primaryUser: Types.ObjectId;
  participants: {
    set(arg0: string, arg1: boolean): unknown;
    _id: any; user: Types.ObjectId; isAllow: Boolean, score: number
  }[];
  schedule: {
    date: string;
    day: string;
    time: string;
  };
  selectedUser: { user: Types.ObjectId }[] | [];
  status: PodcastStatus;
  recordingUrl: Object;
  score: number;
  createdAt?: Date;
  notificationSent: Boolean,
  roomCodes: IRoomCode[],
};

const podcastSchema = new Schema<PodcastSchema>({
  primaryUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participants: [
    {
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      isAllow: { type: Boolean, default: false },
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
      user: { type: Schema.Types.ObjectId, ref: "User", default: "" },
    }
  ],
  status: {
    type: String,
    enum: PodcastStatus,
    default: PodcastStatus.NOT_SCHEDULED,
  },
  recordingUrl: {
    type: Object,
    default: {},
  },
  roomCodes: [RoomCodeSchema],
  score: {
    type: Number,
    default: 0,
  },
  notificationSent: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const Podcast = model<PodcastSchema>("Podcast", podcastSchema);
export default Podcast;
