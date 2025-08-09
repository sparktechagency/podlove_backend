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
    host: process.env.MAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });
  // const mailOptions = {
  //   from: `${process.env.SERVICE_NAME}`,
  //   to: email,
  //   date: formattedDate,
  //   subject: "Verification",
  //   text: `Your verification code is ${verificationOTP}`,
  // };
  const mailOptions = {
  from: `"Podlove Support" <${process.env.SERVICE_EMAIL}>`,
  to: email,
  subject: "🔒 Your Podlove Verification Code",
  date: formattedDate,
  html: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Podlove Verification</title>
    <style>
      body {
        background-color: #f4f6fa;
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
      }
      .container {
        max-width: 600px;
        margin: 30px auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .header {
        background-color: #4461f2;
        color: #ffffff;
        padding: 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .body {
        padding: 30px 20px;
        color: #333333;
        line-height: 1.5;
      }
      .body p {
        margin: 0 0 20px;
      }
      .code-box {
        background-color: #f1f3f5;
        border-radius: 4px;
        padding: 15px;
        text-align: center;
        margin: 20px 0;
        font-size: 32px;
        letter-spacing: 4px;
        font-weight: bold;
        color: #4461f2;
      }
      .footer {
        background-color: #f4f6fa;
        padding: 15px 20px;
        font-size: 12px;
        color: #777777;
        text-align: center;
      }
      .footer a {
        color: #4461f2;
        text-decoration: none;
      }
      @media (max-width: 480px) {
        .body, .footer {
          padding: 20px 10px;
        }
        .code-box {
          font-size: 28px;
          padding: 10px;
        }
      }
    </style>
  </head>
  <body>
    <table class="container" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="header">
          <h1>Welcome to Podlove!</h1>
        </td>
      </tr>
      <tr>
        <td class="body">
          <p>Hi there,</p>
          <p>Thank you for signing up for Podlove. To complete your registration, please use the verification code below:</p>
          <div class="code-box">${verificationOTP}</div>
          <p>If you did not request this code, please ignore this email or <a href="https://${process.env.SITE_DOMAIN}/support">contact support</a>.</p>
          <p>Happy podcasting!</p>
          <p>The Podlove Team</p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p>Podlove • <a href="https://${process.env.SITE_DOMAIN}">${process.env.SITE_DOMAIN}</a></p>
          <p>&copy; ${new Date().getFullYear()} Podlove. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `,
};

  const [error, info] = await to(transporter.sendMail(mailOptions));
  if (error) throw new Error(`Failed to send email: ${error.message}`);
  console.log(`Email sent: ${info.response}`);
};

export default sendEmail;
