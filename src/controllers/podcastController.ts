import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import createError from "http-errors";
import MatchedServices from "@services/matchesServices";
import { PodcastStatus, SubscriptionPlanName } from "@shared/enums";
import User from "@models/userModel";
import { logger } from "@shared/logger";
import mongoose, { Types } from "mongoose";

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const user = await User.findById(req.user.userId);
  // if (user!.isSelectedForPodcast) return res.status(StatusCodes.CONFLICT).json({
  //   success: true,
  //   message: "User is already selected for another podcast",
  //   data: {}
  // });
  let matchCount = 0;
  if (user!.subscription.plan === SubscriptionPlanName.LISTENER) matchCount = 2;
  else if (user!.subscription.plan === SubscriptionPlanName.SPEAKER) matchCount = 3;
  else matchCount = 4;
  const participants = await MatchedServices.match(user!._id as string, matchCount);
  // if (participants.length !== matchCount)
  //   return res.status(StatusCodes.OK).json({
  //     success: true,
  //     message: "Not enough compatible user for the podcast",
  //     data: {}
  //   });
  const podcast = await Podcast.create({ primaryUser: user!._id, participants: participants });
  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "User successfully scheduled for the podcast",
    data: podcast,
  });
};

const sendPodcastRequest = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;
  if (!userId) {
    return next(createError(StatusCodes.UNAUTHORIZED, "User not authenticated"));
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1) Validate payload
    const { status, schedule } = req.body;
    if (!Object.values(PodcastStatus).includes(status)) {
      throw createError(StatusCodes.BAD_REQUEST, "Invalid podcast status");
    }
    if (
      typeof schedule !== "object" ||
      typeof schedule.date !== "string" ||
      typeof schedule.day !== "string" ||
      typeof schedule.time !== "string"
    ) {
      throw createError(StatusCodes.BAD_REQUEST, "Schedule must include date, day, and time strings");
    }

    // 2) Update the Podcast document for this user
    const updated = await Podcast.findOneAndUpdate(
      { primaryUser: userId },
      {
        $set: {
          status,
          schedule: {
            date: schedule.date,
            day: schedule.day,
            time: schedule.time,
          },
        },
      },
      { new: true, session }
    )
      .lean()
      .exec();

    if (!updated) {
      throw createError(StatusCodes.NOT_FOUND, "Podcast not found for this user");
    }

    // 3) Commit & respond
    await session.commitTransaction();
    session.endSession();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Podcast request updated successfully",
      data: updated,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }
};

const getPodcastEvents = async (req: Request, res: Response, next: NextFunction): Promise<any> => {};

const getPodcasts = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { id, status } = req.query;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  if (page < 1 || limit < 1) throw createError(StatusCodes.BAD_REQUEST, "Page and limit must be positive integers");

  if (id) {
    const podcast = await Podcast.findById(id)
      .populate({ path: "primaryUser", select: "name avatar" })
      .populate({ path: "participants", select: "name avatar" })
      .lean();

    if (!podcast) throw createError(StatusCodes.NOT_FOUND, "Podcast not found");

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Podcast retrieved successfully",
      data: podcast,
    });
  }

  let statusFilter: any = {};
  if (status) {
    if (status === "done") {
      statusFilter.status = PodcastStatus.DONE;
    } else if (status === "not_scheduled") {
      statusFilter.status = PodcastStatus.NOT_SCHEDULED;
    } else if (status === "req_scheduled") {
      statusFilter.status = PodcastStatus.REQSHEDULED;
    } else if (status === "scheduled") {
      statusFilter.status = PodcastStatus.SCHEDULED;
    } else if (status === "upcoming") {
      statusFilter.status = { $in: [PodcastStatus.NOT_SCHEDULED, PodcastStatus.SCHEDULED] };
    }
  }

  const podcasts = await Podcast.find(statusFilter)
    // Only pull back fields you’ll actually return
    .select("primaryUser participants.score schedule status createdAt")
    .skip(skip)
    .limit(limit)
    .populate([
      {
        path: "primaryUser",
        select: "name avatar",
      },
      {
        path: "participants.user", // drill into the subdoc
        select: "name avatar",
      },
    ])
    .lean()
    .exec();

  const total = await Podcast.countDocuments(statusFilter);
  const totalPages = Math.ceil(total / limit);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: podcasts.length ? "Successfully retrieved podcasts" : "No podcasts found",
    data: {
      podcasts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    },
  });
};



const PodcastController = {
  create,
  getPodcasts,
  sendPodcastRequest
};

export default PodcastController;
