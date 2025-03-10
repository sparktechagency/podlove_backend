import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import createError from "http-errors";
import MatchedServices from "@services/matchesServices";
import { PodcastStatus, SubscriptionPlanName } from "@shared/enums";
import User from "@models/userModel";
import { Types } from "mongoose";

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  // const user = await User.findById(req.user.userId);
  // if(user!.isSelectedForPodcast) return res.status(StatusCodes.CONFLICT).json({success: true, message: "User is already selected for another podcast", data : {}});
  // let matchCount = 0;
  // if (user!.subscription.plan === SubscriptionPlanName.LISTENER) matchCount = 2;
  // else if (user!.subscription.plan === SubscriptionPlanName.SPEAKER) matchCount = 3;
  // else matchCount = 4;
  //
  // [error, participants] = await to(MatchedServices.match(userId, matchCount));
  //
  //
  // const participantsObjectIds = participants.map((id: string) => new Types.ObjectId(id));
  //
  // [error, podcast] = await to(Podcast.create({ primaryUser: userId, participants: participantsObjectIds }));
  // if (error) return next(error);
  //
  // return res.status(StatusCodes.CREATED).json({ success: true, message: "Success", data: podcast });
};


const getPodcasts = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const status = req.query.status;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  if (page < 1 || limit < 1) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Page and limit must be positive integers",
      data: {}
    });
  }
  let query = {};
  if (status === "before") {
    query = { status: { $in: [PodcastStatus.NOT_SCHEDULED, PodcastStatus.SCHEDULED] } };
  } else if (status === "after") {
    query = { status: { $in: [PodcastStatus.DONE] } };
  }

  const podcasts = await
    Podcast.find(query)
      .populate({ path: "primaryUser", select: "name avatar" })
      .populate({ path: "participants", select: "name avatar" })

      .skip(skip)
      .limit(limit)
      .lean();


  const total = await Podcast.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Successfully retrieved podcasts",
    data: {
      podcasts,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }
  });
};

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  const [error, podcast] = await to(Podcast.findById(id).lean());
  if (error) return next(error);
  if (!podcast) return next(createError(StatusCodes.NOT_FOUND, "Podcast not found"));
  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: podcast });
};

const getAll = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const [error, podcasts] = await to(Podcast.find().lean());
  if (error) return next(error);
  if (!podcasts || podcasts.length === 0)
    return res.status(StatusCodes.OK).json({ success: true, message: "No podcast found", data: { podcasts: [] } });
  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: { podcasts: podcasts } });
};

const PodcastController = {
  create,
  get,
  getAll
};

export default PodcastController;
