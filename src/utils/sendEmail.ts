import nodemailer from "nodemailer";
import to from "await-to-ts";
import "dotenv/config";

const currentDate = new Date();

const formattedDate = currentDate.toLocaleDateString("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const sendEmail = async (email: string, verificationOTP: string) => {
  const transporter = nodemailer.createTransport({
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
  const [error, info] = await to(transporter.sendMail(mailOptions));
  if (error) throw new Error(`Failed to send email: ${error.message}`);
  console.log(`Email sent: ${info.response}`);
};

export default sendEmail;
