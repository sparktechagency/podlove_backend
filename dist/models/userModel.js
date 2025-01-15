"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const enum_1 = require("../shared/enum");
const userSchema = new mongoose_1.Schema({
    auth: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Auth",
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    address: {
        type: String,
        default: null,
    },
    age: {
        type: Number,
        min: 35,
    },
    gender: {
        type: String,
        enum: Object.values(enum_1.Gender),
    },
    bodyType: {
        type: String,
        enum: Object.values(enum_1.BodyType),
    },
    ethnicity: {
        type: String,
        enum: Object.values(enum_1.Ethnicity),
    },
    bio: {
        type: String,
        trim: true,
    },
    personalality: {
        specturm: {
            type: Number,
            min: 1,
            max: 7,
        },
        balance: {
            type: Number,
            min: 1,
            max: 7,
        },
        focus: {
            type: Number,
            min: 1,
            max: 7,
        },
    },
    interests: {
        type: [String],
        default: [],
    },
    avatar: {
        type: String,
        default: "",
    },
    compatibility: {
        type: [String],
        default: [],
    },
    location: {
        place: {
            type: String,
        },
        longitude: {
            type: Number,
        },
        latitude: {
            type: Number,
        },
    },
    preferences: {
        gender: {
            type: String,
            enum: Object.values(enum_1.Gender),
        },
        age: {
            min: {
                type: Number,
            },
            max: {
                type: Number,
            },
        },
        bodyType: {
            type: String,
            enum: Object.values(enum_1.BodyType),
        },
        ethnicity: {
            type: String,
            enum: Object.values(enum_1.Ethnicity),
        },
        distance: {
            type: Number,
        },
    },
    survey: {
        type: [String],
        default: [],
    },
}, {
    timestamps: true,
});
exports.User = (0, mongoose_1.model)("User", userSchema);
exports.default = exports.User;
