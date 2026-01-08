import { Request, Response, NextFunction } from "express";
import User from "@models/userModel";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import createError from "http-errors";
import Auth from "@models/authModel";
import { SubscriptionPlanName, SubscriptionStatus } from "@shared/enums";
import OpenaiServices from "./openaiServices";
import cron from "node-cron";
import { logger } from "@shared/logger";
import Notification from "@models/notificationModel";
import Podcast from "@models/podcastModel";

cron.schedule("0 0 * * *", async () => { // every day at midnight
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    console.log("Cron job running", now);

    const users = await Auth.find({
      shareFeedback: "",
      createdAt: { $lte: sevenDaysAgo }
    });

    if (users.length === 0) return;

    for (const user of users) {
      user.shareFeedback = "7days";
      await user.save();

      const feedbackNotification = await Notification.create({
        type: "podcast_feedback",
        user: user._id,
        message: [
          {
            title: "Share your feedback!",
            description: "Please fill the survey for your podcast feedback.",
          },
        ],
        read: false,
        section: "user",
      });

      if (!feedbackNotification) {
        logger.error(`Notification failed for user: ${user._id}`);
      }
    }

    logger.info(`Updated shareFeedback and notifications for ${users.length} users`);
  } catch (error) {
    logger.error("Error in feedback cron job:", error);
  }
});

const getAllPremiumUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { search } = req.query;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;

  if (page < 1 || limit < 1) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Page and limit must be positive integers",
    });
  }

  const skip = (page - 1) * limit;

  let query: any = { "subscription.status": SubscriptionStatus.PAID };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { "subscription.plan": { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query).select("name subscription avatar").lean().skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  const subscriptionCounts = await User.aggregate([
    {
      $group: {
        _id: "$subscription.plan",
        count: { $sum: 1 },
      },
    },
  ]);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: users.length ? "Successfully retrieved premium users information" : "No premium users found",
    data: {
      subscriptionCounts,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    },
  });
};

const validateBio = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const bio = req.body.text as string;
  const userId = req.user?.userId;
  if (!userId) {
    return next(createError(StatusCodes.UNAUTHORIZED, "User not authenticated"));
  }
  const result = await OpenaiServices.analyzeBio(bio);
  // console.log("result: ", result);
  if (result === true) {
    const updatedUserBio = await User.findByIdAndUpdate(
      userId,
      { $set: { bio: bio.trim() } },
      {
        new: true,
      }
    );
    // console.log("updatedUserBio: ", updatedUserBio)
    if (!updatedUserBio) {
      return next(createError(StatusCodes.NOT_FOUND, "User not found"));
    }
    return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: { updatedUserBio } });
  }

  const errorMessage =
    "Your bio contains content that violates our guidelines. Please ensure it does not include:\n1. Profanity, hate speech, or explicit content\n2. Personal information such as phone numbers, addresses, emails, or identifiable details\n3. Spam, random characters, or nonsensical phrases.";

  throw createError(StatusCodes.BAD_REQUEST, errorMessage);
};

const block = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const authId = req.params.authId;
  const [error, auth] = await to(Auth.findById(authId));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User not found"));

  if (auth.isBlocked) {
    auth.isBlocked = false;
  } else if (!auth.isBlocked) {
    auth.isBlocked = true;
  }
  await auth.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: auth.isBlocked ? "User blocked successfully" : "User unblocked successfully",
    data: { isBlocked: auth.isBlocked },
  });
};

const unblock = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const authId = req.params.authId;
  const [error, auth] = await to(Auth.findById(authId));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User not found"));

  auth.isBlocked = false;
  await auth.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "User blocked successfully",
    data: { isBlocked: auth.isBlocked },
  });
};

const getUserSubscriptions = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user?.userId;
  if (!userId) {
    return next(createError(StatusCodes.UNAUTHORIZED, "User not authenticated"));
  }

  const result = await User.findById(userId).select("subscription chatingtime createdAt");

  const podcastUser = await Podcast.findOne({
    isComplete: false,
    $or: [
      { "participants.user": userId },
      { primaryUser: userId }
    ]
  }).lean();

  let primaryUser: any = null;
  if (podcastUser) {
    primaryUser = await User.findById(podcastUser?.primaryUser).select("subscription chatingtime createdAt");
  }

  if (!result) {
    return next(createError(StatusCodes.NOT_FOUND, "User not found"));
  }

  let bioPreview: boolean;
  let chatWindow: boolean = false;
  const currentDate = new Date();

  console.log("User subscription plan: ", result.subscription.plan);

  switch (result.subscription.plan) {
    case SubscriptionPlanName.SAMPLER:
      bioPreview = false;
      break;

    case SubscriptionPlanName.SEEKER:
      bioPreview = false;
      break;

    case SubscriptionPlanName.SCOUT:
      bioPreview = true;
      break;

    default:
      return next(createError(StatusCodes.BAD_REQUEST, "Invalid subscription plan"));
  }

  if (primaryUser?.subscription?.plan) {
    switch (primaryUser.subscription.plan) {
      case SubscriptionPlanName.SAMPLER:
        if (primaryUser) {
          const timePassedSinceCreated = (currentDate.getTime() - new Date(result.createdAt).getTime()) / 1000 / 3600; // hours passed
          if (timePassedSinceCreated <= 72) {
            chatWindow = true;
          }
        }
        break;

      case SubscriptionPlanName.SEEKER:
        if (primaryUser) {
          const timePassedSinceCreatedSeeker = (currentDate.getTime() - new Date(result.createdAt).getTime()) / 1000 / 3600 / 24;
          if (timePassedSinceCreatedSeeker <= 7) {
            chatWindow = true;
          }
        }
        break;

      case SubscriptionPlanName.SCOUT:
        chatWindow = true;
        break;

      default:
        return next(createError(StatusCodes.BAD_REQUEST, "Invalid subscription plan"));
    }
  }

  // Send response with all the subscription details
  return res.json({
    status: result.subscription?.status,
    startedAt: result.subscription?.startedAt,
    endDate: result.subscription?.endDate,
    plan: result.subscription.plan,
    bioPreview,
    chatWindow,
  });
};

const UserServices = {
  getUserSubscriptions,
  getAllPremiumUsers,
  validateBio,
  block,
  unblock,
};

export default UserServices;
