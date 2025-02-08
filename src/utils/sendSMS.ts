import { to } from "await-to-ts";
import "dotenv/config";
import twilio from "twilio";
import { logger } from "@shared/logger";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const client = twilio(accountSid, authToken);

const sendMessage = async (phoneNumber: string, verificationOTP: string) => {
  const messageBody = `Your verification code is ${verificationOTP}`;
  try {
    const [error, message] = await to(
      client.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      })
    );
    if (error) throw new Error(`Failed to send SMS: ${error.message}`);
    logger.info(`Message sent: ${message.sid}`);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
  }
};

export default sendMessage;
