import VerifyPhone from "@models/phoneModel";
import twilio from "twilio";

// const account_sid = process.env.TWILIO_ACCOUNT_SID;
// const auth_token = process.env.TWILIO_AUTH_TOKEN;
// const phone_number = process.env.TWILIO_PHONE_NUMBER;

const account_sid = 'ACbf57a53431bf3db00dc2011280c35c19';
const auth_token = '5e56cbebc1a6160863afea4d662a4b1d'
const phone_number = '+18555259062'

const client = twilio(account_sid, auth_token);

interface IResponse {
    invalid: boolean;
    message: string;
    otp?: string;
}

const isValidPhoneNumber = (phone: string): boolean =>
    /^\+\d{10,15}$/.test(phone);

export const sendPhoneVerificationMessage = async (
    phoneNumber: string
): Promise<IResponse> => {

    if (!account_sid || !auth_token || !phone_number) {
        return { invalid: true, message: "Twilio configuration missing." };
    }

    if (!isValidPhoneNumber(phoneNumber)) {
        return { invalid: true, message: "Phone must be E.164 format." };
    }

    // Prevent repeat OTP if still valid
    const existing = await VerifyPhone.findOne({ number: phoneNumber });

    // Rate limit — max 5 per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await VerifyPhone.countDocuments({
        number: phoneNumber,
        otpExpiredAt: { $gte: oneHourAgo }
    });

    if (count >= 5) {
        return { invalid: true, message: "Too many OTP attempts. Try later." };
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save or update OTP
    if (existing) {
        existing.otp = otp;
        existing.otpExpiredAt = expiresAt;
        existing.used = false;
        await existing.save();
    } else {
        await VerifyPhone.create({
            number: phoneNumber,
            otp,
            otpExpiredAt: expiresAt
        });
    }

    // Send with Twilio
    await client.messages.create({
        body: `Your verification code is: ${otp}`,
        from: phone_number,
        to: phoneNumber
    });

    return { invalid: false, message: "OTP sent successfully.", otp };
};
