"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const await_to_ts_1 = require("await-to-ts");
require("dotenv/config");
const twilio_1 = __importDefault(require("twilio"));
const logger_1 = require("@shared/logger");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = (0, twilio_1.default)(accountSid, authToken);
const sendMessage = async (phoneNumber, verificationOTP) => {
    const messageBody = `Your verification code is ${verificationOTP}`;
    try {
        const [error, message] = await (0, await_to_ts_1.to)(client.messages.create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber,
        }));
        if (error)
            throw new Error(`Failed to send SMS: ${error.message}`);
        logger_1.logger.info(`Message sent: ${message.sid}`);
    }
    catch (err) {
        console.error(`Error: ${err.message}`);
    }
};
exports.default = sendMessage;
