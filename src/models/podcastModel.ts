import { Schema, model } from "mongoose";
import { PodcastSchema } from "@schemas/podcastSchema";
import { PodcastStatus } from "@shared/enums";

const podcastSchema = new Schema<PodcastSchema>({
  primaryUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participant1: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participant2: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participant3: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
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
