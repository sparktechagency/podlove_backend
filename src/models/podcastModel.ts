import { Schema, model } from "mongoose";
import { PodcastSchema } from "@schemas/podcastSchema";
import { PodcastStatus } from "@shared/enum";

const podcastSchema = new Schema<PodcastSchema>({
  primayUser: {
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
    type: Date,
    default: null,
  },
  selectedUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: PodcastStatus,
    default: PodcastStatus.NOT_SCHEDULED,
  },
});

const Podcast = model<PodcastSchema>("Podcast", podcastSchema);
export default Podcast;
