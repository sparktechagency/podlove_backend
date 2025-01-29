"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const enums_1 = require("../shared/enums");
const podcastSchema = new mongoose_1.Schema({
    primaryUser: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    participant1: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    participant2: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    participant3: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    schedule: {
        date: {
            type: String,
            default: ""
        },
        time: {
            type: String,
            default: ""
        }
    },
    selectedUser: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    status: {
        type: String,
        enum: enums_1.PodcastStatus,
        default: enums_1.PodcastStatus.NOT_SCHEDULED
    },
    recordingUrl: {
        type: String,
        default: ""
    }
});
const Podcast = (0, mongoose_1.model)("Podcast", podcastSchema);
exports.default = Podcast;
