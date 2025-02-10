"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const sendSMS = async (phoneNumber, verificationOTP) => {
    const messageBody = `Your verification code is ${verificationOTP}`;
    const accountSid = 'ACbf57a53431bf3db00dc2011280c35c19';
    const authToken = '31df442714ae41c616b56b6645028190';
    const client = require('twilio')(accountSid, authToken);
    client.messages
        .create({
        body: messageBody,
        from: '+18555259062',
        to: phoneNumber
    })
        .then((message) => console.log(message.sid));
};
exports.default = sendSMS;
