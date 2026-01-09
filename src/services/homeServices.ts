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

function summarizeSelectedUserPodcasts(podcasts: any): HostSummary[] {
  return podcasts.map(
    (p: { primaryUser: { _id: any; name: any; bio: any; interests: any }; participants: { score: number }[] }) => {
      const { _id, name, bio, interests } = p.primaryUser;
      const score = p.participants[0]?.score ?? 0;
      return { _id, name, bio, interests, score };
    }
  );
}

const homeData = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user.userId;
    const userObjId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    // console.log("userId: ", userId, " userObjId: ", userObjId);
    // Fetch the user (with their auth email)

    const user = await User.findById(userId).populate({ path: "auth", select: "email isBlocked shareFeedback chatingtime" }).lean<LeanUserWithAuth>();
    // console.log("user home: ", user);
    if (!user) {
      throw next(createError(StatusCodes.NOT_FOUND, "You account is not found"));
    }
    if (user.auth.isBlocked) {
      throw next(createError(StatusCodes.FORBIDDEN, "You Account is Blocked by Admisnistrator, Please contact our assistance"))
    }

    let podcast = await Podcast.findOne({
      $or: [{ primaryUser: userId }, { "participants.user": userId }],
      isComplete: false,
    })
      .populate({ path: "participants.user", select: "name bio interests" })
      .populate({ path: "primaryUser", select: "name bio interests" })
      .lean();

    // console.log("podcast home: ", podcast);
    const isPrimaryUser = !!podcast && podcast.primaryUser._id.toString() === userId;


    const subscriptionPlans = await SubscriptionPlan.find().lean();


    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Success",
      data: {
        user,
        podcast: podcast || {},
        subscriptionPlans,
        isPrimaryUser,
        // hostPodcastMatches,
      },
    });
  } catch (err) {
    // Forward the error to your error‑handling middleware
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
