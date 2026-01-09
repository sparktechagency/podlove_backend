import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel";
import { StatusCodes } from "http-status-codes";
import SubscriptionPlan from "@models/subscriptionPlanModel";
import User from "@models/userModel";
import mongoose, { ClientSession, Types } from "mongoose";
import createError from "http-errors";
import { LeanUserWithAuth } from "@shared/homeInterface";
import matchingConfig from "@config/matchingConfig";

interface HostSummary {
  _id: Types.ObjectId;
  name: string;
  bio: string;
  interests: string[];
  score: number;
}

function summarizeSelectedUserPodcast(podcast: any): HostSummary[] {
  if (!podcast?.primaryUser) return [];

  const { _id, name, bio, interests } = podcast.primaryUser;
  const score = podcast.participants?.[0]?.score ?? 0;

  return [{ _id, name, bio, interests, score }];
}


const homeData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId)
      .populate({
        path: "auth",
        select: "email isBlocked shareFeedback chatingtime",
      })
      .lean<LeanUserWithAuth>();

    if (!user) {
      return next(createError(StatusCodes.NOT_FOUND, "Your account was not found"));
    }

    if (user.auth?.isBlocked) {
      return next(
        createError(
          StatusCodes.FORBIDDEN,
          "Your account is blocked by the administrator. Please contact support."
        )
      );
    }

    let podcast = await Podcast.findOne({
      $or: [{ primaryUser: userId }, { "participants.user": userId }],
      isComplete: false,
    })
      .populate({ path: "participants.user", select: "name bio interests" })
      .populate({ path: "primaryUser", select: "name bio interests" })
      .lean();

    const isPrimaryUser =
      !!podcast && podcast.primaryUser?._id.toString() === userId;

    if (podcast) {

      const participantsArray = podcast.participants.map(
        ({ user, score, isAllow, isRequest, isQuestionAnswer }) => ({
          ...user,
          score,
          isAllow,
          isRequest,
          isQuestionAnswer,
        })
      );


      podcast.participants = participantsArray as any;
    } else {
      podcast = {
        participants: [],
        selectedUser: [],
      } as any;
    }

    const subscriptionPlans = await SubscriptionPlan.find().lean();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Success",
      data: {
        user,
        podcast,
        subscriptionPlans,
        isPrimaryUser,
      },
    });
  } catch (err) {
    next(err);
  }
};

const homeCompletedPodcastData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return next(createError(StatusCodes.UNAUTHORIZED, "Unauthorized"));
    }

    const user = await User.findById(userId)
      .populate({
        path: "auth",
        select: "email isBlocked shareFeedback chatingtime",
      })
      .lean<LeanUserWithAuth>();

    if (!user) {
      return next(
        createError(StatusCodes.NOT_FOUND, "Your account was not found")
      );
    }

    const podcasts = await Podcast.find({
      isComplete: true,
      $or: [
        { primaryUser: userId },
        { "participants.user": userId },
      ],
    })
      .populate({
        path: "participants.user",
        select: "name bio interests",
      })
      .populate({
        path: "primaryUser",
        select: "name bio interests",
      })
      .lean();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Success",
      data: {
        podcast: podcasts ?? [],
      },
    });
  } catch (err) {
    next(err);
  }
};


const HomeServices = {
  homeData,
  homeCompletedPodcastData,
};

export default HomeServices;
