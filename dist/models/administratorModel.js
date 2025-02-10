"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const enums_1 = require("@shared/enums");
const administratorSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    contact: {
        type: String,
        required: true
    },
    address: {
        type: String,
        default: ""
    },
    password: {
        type: String,
        required: true
    },
    // role: {
    //   type: String,
    //   required: true,
    //   enum: AdminRole,
    // },
    access: {
        type: String,
        required: true,
        enum: Object.values(enums_1.AdminAccess)
    },
    recoveryOTP: {
        type: String
    },
    recoveryOTPExpiredAt: {
        type: Date
    }
});
const Administrator = (0, mongoose_1.model)("Administrator", administratorSchema);
exports.default = Administrator;
