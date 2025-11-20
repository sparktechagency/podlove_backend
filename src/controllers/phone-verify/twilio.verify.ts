import Auth from '@models/authModel';
import User from '@models/userModel';
import twilio from 'twilio';

const account_sid = process.env.TWILIO_ACCOUNT_SID;
const auth_token = process.env.TWILIO_AUTH_TOKEN;
const phone_number = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(account_sid, auth_token);

interface ISendResponse {
    invalid: boolean;
    message: string;
}

const isValidPhoneNumber = (phone: string): boolean => /^\+\d{10,15}$/.test(phone);

export const sendPhoneVerificationsMessage = async (
    message: string,
    phoneNumber: string,
    verifyOtp: string | number,
    user: string | any,
    countryCode: string,
    phone: string
): Promise<ISendResponse> => {

    if (!isValidPhoneNumber(phoneNumber)) {
        return {
            invalid: true,
            message: "Invalid phone number format. Use E.164 format (e.g., +1234567890)."
        };
    }

    console.log("phoneNumber:", phoneNumber, user);
    console.log("Twilio SID:", account_sid);
    console.log("Twilio Auth Token:", auth_token);
    console.log("Twilio From Number:", phone_number);


    try {
        const result = await client.messages.create({
            body: message,
            from: phone_number,
            to: phoneNumber
        });

        if (result) {
            const updateAuth = await Auth.findByIdAndUpdate(
                user.authId,
                { verifyOtp }
            );

            if (!updateAuth) {
                throw new Error("Error updating verify code in the database. Please try again!");
            }

            let updateUser = await User.findByIdAndUpdate(
                user.userId,
                { phone_number: phone, phone_c_code: countryCode }
            );


            if (!updateUser) {
                throw new Error("Error updating phone number in the database. Please try again!");
            }
        }

        return {
            invalid: false,
            message: `Message sent successfully to ${phoneNumber}`
        };

    } catch (error: any) {
        throw new Error(error.message || "Failed to send SMS");
    }
};
