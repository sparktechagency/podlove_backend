import Notification from "@models/notificationModel";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { Types } from "twilio/lib/rest/content/v1/content";

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const total = await Notification.countDocuments({ user: userId });
    const notifications = await Notification.find({ user: userId })
      .select("type message read section createdAt")
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
};

const updateRead = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user.userId;
    const result = await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "All notifications marked as read",
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const deleteRead = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user.userId;
    const result = await Notification.deleteMany({
      user: userId,
      read: true,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "All read notifications deleted",
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const NotificationController = {
  get,
  updateRead,
  deleteRead
};

export default NotificationController;
