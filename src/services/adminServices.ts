import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import createError from "http-errors";
import mongoose from "mongoose";
import User from "@models/userModel";
import Notification from "@models/notificationModel";
import nodemailer from "nodemailer";
import to from "await-to-ts";
import "dotenv/config";

const currentDate = new Date();

const formattedDate = currentDate.toLocaleDateString("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type payload = {
  isAll: boolean;
  userId: string;
  message: string;
  medium: Array<"Email" | "Notification">;
};
type Recipient = { _id: mongoose.Types.ObjectId; email: string };

const sendEmail = async (email: string, message: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });
  const mailOptions = {
    from: `${process.env.SERVICE_NAME}`,
    to: email,
    date: formattedDate,
    subject: "Message from Admin",
    text: `${message}`,
  };
  const [error, info] = await to(transporter.sendMail(mailOptions));
  if (error) throw new Error(`Failed to send email: ${error.message}`);
  console.log(`Email sent: ${info.response}`);
};

// const sendMessage = async (req: Request<{}, {}, payload>, res: Response, next: NextFunction): Promise<any> => {
//   const { isAll, userId, message, medium } = req.body;
//   if (typeof isAll !== "boolean" || !message || !medium) {
//     return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Bad Request", data: {} });
//   }

//   if (isAll === false && !userId) {
//     return res.status(StatusCodes.BAD_REQUEST).json({
//       success: false,
//       message: "Bad Request. User Id required",
//       data: {}
//     });
//   }

//   res.status(StatusCodes.OK).json({
//     success: true,
//     message: "Message Sent Successfully",
//     data: {}
//   });
// };

const sendMessage = async (req: Request<{}, {}, payload>, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { isAll, userId, message, medium } = req.body;
    // 1) Validate payload
    if (typeof isAll !== "boolean" || !message || !Array.isArray(medium) || medium.length === 0) {
      throw createError(StatusCodes.BAD_REQUEST, "Missing or invalid fields");
    }
    if (!isAll && !userId) {
      throw createError(StatusCodes.BAD_REQUEST, "userId is required when isAll is false");
    }
    if (!(medium.includes("Email") || medium.includes("Notification"))) {
      throw createError(StatusCodes.BAD_REQUEST, "medium must include 'Email' or 'Notification'");
    }

    // 2) Build recipients query
    const filter = isAll ? {} : { _id: new mongoose.Types.ObjectId(userId!) };

    // 3) Fetch recipients in one query
    const rawRecipients = await User.find(filter, "_id email").lean().exec();
    const recipients: Recipient[] = rawRecipients.map((u: any) => ({
      _id: u._id as mongoose.Types.ObjectId,
      email: u.email as string,
    }));
    if (!isAll && recipients.length === 0) {
      throw createError(StatusCodes.NOT_FOUND, "User not found");
    }

    // 4) Notification batch
    let notifCount = 0;
    if (medium.includes("Notification")) {
      const docs = recipients.map((u) => ({
        type: "admin_message",
        user: u._id,
        message,
      }));
      const result = await Notification.insertMany(docs, { ordered: false });
      notifCount = result.length;
    }

    // 5) Email parallel (can throttle if needed)
    let emailCount = 0;
    if (medium.includes("Email")) {
      await Promise.all(
        recipients.map(async (u) => {
          try {
            await sendEmail(u?.email, `<p>${message}</p>`);
            emailCount++;
          } catch {
            // optionally log individual failures
          }
        })
      );
    }

    // 6) Return summary
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Message dispatched",
      data: {
        totalRecipients: recipients.length,
        notificationsCreated: notifCount,
        emailsSent: emailCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

const AdminServices = { sendMessage };

export default AdminServices;
