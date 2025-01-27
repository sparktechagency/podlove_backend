"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../shared/enums");
const userSchema = new mongoose_1.Schema({
    auth: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Auth",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        default: ""
    },
    age: {
        type: Number,
        min: 35,
        default: 35
    },
    gender: {
        type: String,
        enum: Object.values(enums_1.Gender),
        default: ""
    },
    bodyType: {
        type: String,
        enum: Object.values(enums_1.BodyType),
        default: ""
    },
    ethnicity: {
        type: String,
        enum: Object.values(enums_1.Ethnicity),
        default: ""
    },
    bio: {
        type: String,
        trim: true,
        default: ""
    },
    personality: {
        spectrum: {
            type: Number,
            min: 1,
            max: 7,
            default: 1
        },
        balance: {
            type: Number,
            min: 1,
            max: 7,
            default: 1
        },
        focus: {
            type: Number,
            min: 1,
            max: 7,
            default: 1
        }
    },
    interests: {
        type: [String],
        default: []
    },
    avatar: {
        type: String,
        default: ""
    },
    compatibility: {
        type: [String],
        default: []
    },
    location: {
        place: {
            type: String,
            default: ""
        },
        longitude: {
            type: Number,
            default: 0
        },
        latitude: {
            type: Number,
            default: 0
        }
    },
    preferences: {
        gender: {
            type: String,
            enum: Object.values(enums_1.Gender),
            default: ""
        },
        age: {
            min: {
                type: Number,
                default: 35
            },
            max: {
                type: Number,
                default: 80
            }
        },
        bodyType: {
            type: String,
            enum: Object.values(enums_1.BodyType),
            default: ""
        },
        ethnicity: {
            type: String,
            enum: Object.values(enums_1.Ethnicity),
            default: ""
        },
        distance: {
            type: Number,
            default: 0
        }
    },
    survey: {
        type: [String],
        default: []
    },
    subscription: {
        id: {
            type: String,
            default: ""
        },
        plan: {
            type: String,
            default: enums_1.SubscriptionPlan.LISTENER
        },
        fee: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: Object.values(enums_1.SubscriptionStatus),
            default: ""
        },
        startedAt: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true
});
exports.User = (0, mongoose_1.model)("User", userSchema);
exports.default = exports.User;
