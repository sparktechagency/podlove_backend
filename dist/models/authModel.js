"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const authSchema = new mongoose_1.Schema({
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
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
    googleId: {
        type: String,
    },
    appleId: {
        type: String,
    },
});
const Auth = (0, mongoose_1.model)("Auth", authSchema);
exports.default = Auth;
