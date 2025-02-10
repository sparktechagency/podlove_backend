import "dotenv/config";

const sendSMS = async (phoneNumber: string, verificationOTP: string) => {
    const messageBody = `Your verification code is ${verificationOTP}`;
    const accountSid = 'ACbf57a53431bf3db00dc2011280c35c19';
    const authToken = '066ab30d775138e33d274ca7c052b996';
    const client = require('twilio')(accountSid, authToken);
    client.messages
        .create({
            body: messageBody,
            from: '+18555259062',
            to: phoneNumber
        })
    .then((message: { sid: any; }) => console.log(message.sid));
};

export default sendSMS;
