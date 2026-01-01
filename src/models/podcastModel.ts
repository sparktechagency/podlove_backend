import { Document, Types, Schema, model } from "mongoose";
import { PodcastStatus, PodcastType } from "@shared/enums";
import { IRoomCode } from "src/podcast/podcast.interface";

const RoomCodeSchema: Schema = new Schema<IRoomCode>({
  id: { type: String, required: true },
  code: { type: String, required: true },
  room_id: { type: String, required: true, index: true },
  role: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  created_at: { type: String, required: true },
  updated_at: { type: String, required: true },
});

export type PodcastSchema = Document & {
  finishStatus: string | null;
  questionsStatus: string | null;
  scheduleStatus: string | null;
  room_id: string;
  primaryUser: Types.ObjectId;
  participants: {
    user: Types.ObjectId;
    isAllow: boolean;
    isRequest?: boolean;
    isQuestionAnswer?: string;
    role?: string;
    score: number;
    vectorScore?: number;
    aiScore?: number;
    reasoning?: string;
    _id?: any;
  }[];
  schedule: {
    date: string;
    day: string;
    time: string;
  };
  selectedUser: { user: Types.ObjectId }[] | [];
  status: PodcastStatus;
  recordingUrl: Object[];
  score: number;
  createdAt?: Date;
  notificationSent: Boolean,
  isComplete: Boolean,
  roomCodes: IRoomCode[],
};

const podcastSchema = new Schema<PodcastSchema>({
  primaryUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  participants: [
    {
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      isAllow: { type: Boolean, default: false },
      isRequest: { type: Boolean, default: false },
      isQuestionAnswer: { type: String, default: "" },
      role: { type: String, default: "Sparks", enum: ['Spotlight', 'Sparks'] },
      score: { type: Number, required: true },
      vectorScore: { type: Number, default: 0 },
      aiScore: { type: Number, default: 0 },
      reasoning: { type: String, default: "" }
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
  finishStatus: {
    type: String,
    enum: ["1stFinish", "2ndFinish"],
    default: null,
  },
  questionsStatus: {
    type: String,
    enum: ["1stDone", "2ndDone"],
    default: null,
  },
  scheduleStatus: {
    type: String,
    enum: ["1st", "2nd"],
    default: null,
  },
  recordingUrl: {
    type: [Object],
    default: [],
  },
  room_id: { type: String, default: "" },
  roomCodes: [RoomCodeSchema],
  score: {
    type: Number,
    default: 0,
  },
  isComplete: { type: Boolean, default: false },
  notificationSent: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const Podcast = model<PodcastSchema>("Podcast", podcastSchema);
export default Podcast;
