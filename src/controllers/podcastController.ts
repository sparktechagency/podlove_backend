import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import createError from "http-errors";
import MatchedServices from "@services/matchesServices";
import { PodcastStatus, SubscriptionPlanName } from "@shared/enums";
import User from "@models/userModel";
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
    const { status } = req.body;
    if (!Object.values(PodcastStatus).includes(status)) {
      throw createError(StatusCodes.BAD_REQUEST, "Invalid podcast status");
    }


    // 2) Update the Podcast document for this user
    const updated = await Podcast.findOneAndUpdate(
      { primaryUser: userId },
      {
        $set: {
          status,
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
      statusFilter.status = { $in: [PodcastStatus.DONE, PodcastStatus.SCHEDULED, PodcastStatus.STREAM_START, PodcastStatus.PLAYING, PodcastStatus.FINISHED] };
    }
    //  else if (status === "not_scheduled") {
    //   statusFilter.status = PodcastStatus.NOT_SCHEDULED;
    // } 
    else if (status === "req_scheduled") {
      statusFilter.status = PodcastStatus.REQSHEDULED;
    } else if (status === "scheduled") {
      statusFilter.status = PodcastStatus.SCHEDULED;
    } else if (status === "upcoming") {
      statusFilter.status = { $in: [PodcastStatus.SCHEDULED, PodcastStatus.REQSHEDULED] };
    }
  }
  // console.log("statusFilter: ", statusFilter);

  const podcasts = await Podcast.find(statusFilter)
    // Only pull back fields you’ll actually return
    .select("primaryUser participants.score participants.isAllow schedule status createdAt roomCodes recordingUrl")
    .sort({ createdAt: 1 })
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

  // console.log("podcasts---: ", podcasts);

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

const startPodcast = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const podcastId = req.params.id;
  const userId = req.user.userId;
  if (!mongoose.Types.ObjectId.isValid(podcastId)) {
    throw createError(StatusCodes.BAD_REQUEST, "Invalid podcast ID");
  }
  try {
    const { schedule, status } = req.body;
    const filter = {
      _id: podcastId,
      primaryUser: userId,
      "schedule.date": schedule.date,
      "schedule.day": schedule.day,
      "schedule.time": schedule.time,
    };

    const update = {
      $set: { status },
    };

    const result = await Podcast.updateOne(filter, update);
    if (result.matchedCount === 0) {
      // either no such podcast, or schedule didn't match
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Podcast not found or schedule did not match, status not updated",
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Podcast status updated to "${status}"`,
      modifiedCount: result,
    });
  } catch (err) {
    next(err);
  }
};

const updateRecording = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;
  const podcastId = req.params.id;
  const file = req.file;
  const audioFile = req.file;
  // console.log("file: ", audioFile);
  if (!file) {
    return next(createError(StatusCodes.BAD_REQUEST, "Recording file is required"));
  }
  const recordingUrl = `/uploads/recordings/${file.filename}`;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { status } = req.body;
    // Only the podcast owner (primaryUser) can update
    const updated = await Podcast.findOneAndUpdate(
      { _id: podcastId, primaryUser: userId },
      { $set: { recordingUrl, status } },
      { new: true, session }
    )
      .lean()
      .exec();

    if (!updated) {
      throw createError(StatusCodes.NOT_FOUND, "Podcast not found or not yours");
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Recording uploaded successfully",
      data: updated,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const getAdminRecordedPodcast = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const admin = req.admin.id;
  const podcastId = req.params.id;
  if (!admin || !podcastId) {
    throw createError(StatusCodes.BAD_REQUEST, "Admin or Podcast ID is not valid");
  }
  try {
    const findPodcastId = await Podcast.find({ _id: podcastId }).select("_id, recordingUrl status")
    if (!findPodcastId) {
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Record podcast audio not found",
        data: {}
      })
    }
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Recored audio retrived successfully",
      data: { admin, findPodcastId }
    })
  } catch (err) {
    next(err);
  }
}


const PodcastController = {
  create,
  getPodcasts,
  sendPodcastRequest,
  startPodcast,
  updateRecording,
  getAdminRecordedPodcast,
};

export default PodcastController;
