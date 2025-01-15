"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const generateOTP = (length = 4) => {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto_1.default.randomInt(0, digits.length);
        otp += digits[randomIndex];
    }
    return otp;
};
exports.default = generateOTP;
