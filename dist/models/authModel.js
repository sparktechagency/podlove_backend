"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const enums_1 = require("../shared/enums");
const authSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: enums_1.Role,
    },
    verificationOTP: {
        type: String,
    },
    verificationOTPExpiredAt: {
        type: Date,
    },
    recoveryOTP: {
        type: String,
    },
    recoveryOTPExpiredAt: {
        type: Date,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
});
const Auth = (0, mongoose_1.model)("Auth", authSchema);
exports.default = Auth;
