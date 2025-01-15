"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
require("dotenv/config");
const currentDate = new Date();
const formattedDate = currentDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});
const sendEmail = async (email, verificationOTP) => {
    const transporter = nodemailer_1.default.createTransport({
        service: process.env.MAIL_HOST,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });
    const mailOptions = {
        from: `${process.env.SERVICE_NAME}`,
        to: email,
        date: formattedDate,
        subject: "Verification",
        text: `Your verification code is ${verificationOTP}`,
    };
    const [error, info] = await (0, await_to_ts_1.default)(transporter.sendMail(mailOptions));
    if (error)
        throw new Error(`Failed to send email: ${error.message}`);
    console.log(`Email sent: ${info.response}`);
};
exports.default = sendEmail;
