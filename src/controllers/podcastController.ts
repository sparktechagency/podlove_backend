import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import createError from "http-errors";
import MatchedServices from "@services/matchesServices";
import { PodcastStatus, SubscriptionPlanName } from "@shared/enums";
import User from "@models/userModel";

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

const getPodcasts = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const status = req.query.status?.toString().toLowerCase();
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
  const skip = (page - 1) * limit;

  if (req.query.id) {
    const id = req.query.id as string;
    const podcast = await Podcast.findById(id);
    if (!podcast)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Podcast not found",
        data: {},
      });
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Successfully fetched the podcast",
      data: podcast,
    });
  }

  const validStatuses = ["before", "after"];
  if (status && !validStatuses.includes(status)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Invalid status value. Allowed values: 'before', 'after'",
      data: {},
    });
  }

  let query: Record<string, any> = {};
  if (status === "before") {
    query = { status: { $in: [PodcastStatus.NOT_SCHEDULED, PodcastStatus.SCHEDULED] } };
  } else if (status === "after") {
    query = { status: { $in: [PodcastStatus.DONE] } };
  }

  const [podcasts, total] = await Promise.all([
    Podcast.find(query)
      .populate({ path: "primaryUser", select: "name avatar" })
      .populate({ path: "participants", select: "name avatar" })
      .skip(skip)
      .limit(limit)
      .lean(),
    Podcast.countDocuments(query),
  ]);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Successfully retrieved podcasts",
    data: {
      podcasts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
};

const PodcastController = {
  create,
  getPodcasts,
};

export default PodcastController;
