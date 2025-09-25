import { model, Schema } from "mongoose";
import { IRoomCode, IStreamRoom } from "./podcast.interface";
import { ENUM_LIVE_STREAM_STATUS } from "./index";
import Video from "twilio/lib/rest/Video";

const RoomCodeSchema: Schema = new Schema<IRoomCode>({
    id: { type: String, required: true, unique: true },
    code: { type: String, required: true },
    room_id: { type: String, required: true, index: true },
    role: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    created_at: { type: String, required: true },
    updated_at: { type: String, required: true },
});

const RecordingSchema: Schema = new Schema(
    {
        session_id: { type: String, required: true },
        started_at: { type: Date },
        ended_at: { type: Date },
        duration: { type: Number }, // seconds
        url: { type: String, required: true },
    },
    { _id: false }
);

const StreamRoomSchema = new Schema<IStreamRoom>(
    {
        broadcaster: {
            type: Schema.Types.ObjectId,
            ref: 'NormalUser',
            required: true,
        },
        podcastId: {
            type: Schema.Types.ObjectId,
            ref: 'Podcast',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
            trim: true,
        },
        template_id: {
            type: String,
            default: '67ec0c3d4b6eb78daeedc180',
        },
        room_id: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: Object.values(ENUM_LIVE_STREAM_STATUS),
            required: true,
            default: ENUM_LIVE_STREAM_STATUS.wating,
        },
        startTime: {
            type: Date,
            default: null,
        },
        endTime: {
            type: Date,
            default: null,
        },
        roomCodes: [RoomCodeSchema],
        recordings: [RecordingSchema],
    },
    { timestamps: true }
);

const podcastFeedbackSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    podcastId: {
        type: Schema.Types.ObjectId,
        ref: 'Podcast',
        required: true
    },
    responses: [
        {
            question: { type: String, required: true },
            answer: Schema.Types.Mixed
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const surveyFeedbackSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    responses: [
        {
            question: { type: String, required: true },
            answer: Schema.Types.Mixed
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const podcastVideosSchema = new Schema({
    video: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const mediaPolicySchema = new Schema({
    text: {
        type: String,
    },
});
const SMSPolicySchema = new Schema({
    text: {
        type: String,
    },
});

const SMSPolicy = model('SMS-Policy', SMSPolicySchema);
const MediaPolicy = model('Media-Policy', mediaPolicySchema);
const PodcastVideos = model('podcastVideos', podcastVideosSchema);
const PodcastFeedback = model('podcastFeedback', podcastFeedbackSchema);
const SurveyFeedback = model('surveyFeedback', surveyFeedbackSchema);
const StreamRoom = model<IStreamRoom>('StreamRoom', StreamRoomSchema);

export {
    MediaPolicy,
    SMSPolicy,
    PodcastVideos,
    StreamRoom,
    PodcastFeedback,
    SurveyFeedback
};
