import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel"; // Adjust the import path as necessary
import { PodcastStatus } from "@shared/enums";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import createError from "http-errors";
import { error } from "winston";

const getAllNotScheduledPodcasts = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  if (page < 1 || limit < 1) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Page and limit must be positive integers",
    });
  }

  const [error, podcasts] = await to(
    Podcast.find({ status: { $in: [PodcastStatus.NOT_SCHEDULED, PodcastStatus.SCHEDULED] } })
      .populate({ path: "primaryUser", select: "name avatar" })
      .populate({ path: "participants", select: "name avatar" })
      .skip(skip)
      .limit(limit)
      .lean()
  );

  if (error) return next(error);

  if (!podcasts || podcasts.length === 0) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "No podcasts found",
      data: {
        podcasts: [],
        pagination: {
          page,
          limit,
          totalPages: 0,
          totalPodcasts: 0,
        },
      },
    });
  }

  const totalPodcasts = await Podcast.countDocuments({ status: PodcastStatus.NOT_SCHEDULED });
  const totalPages = Math.ceil(totalPodcasts / limit);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Successfully retrieved podcasts",
    data: {
      podcasts,
      pagination: {
        page,
        limit,
        totalPages,
        totalPodcasts,
      },
    },
  });
};

const podcastDone = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const podcastId = req.body.podcastId;
  const [error, podcast] = await to(Podcast.findById(podcastId));
  if (error) return next(error);
  if (!podcast) return next(createError(StatusCodes.NOT_FOUND, "Podcast not found"));

  podcast.status = PodcastStatus.DONE;
  const [saveError] = await to(podcast.save());
  if (saveError) return next(saveError);

  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: { status: podcast.status } });
};

const setSchedule = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { podcastId, date, day, time } = req.body;

  const [error, podcast] = await to(Podcast.findById(podcastId));
  if (error) return next(error);
  if (!podcast) return next(createError(StatusCodes.NOT_FOUND, "Podcast not found!"));

  podcast.schedule.date = date;
  podcast.schedule.day = day;
  podcast.schedule.time = time;
  podcast.status = PodcastStatus.SCHEDULED;

  const [saveError] = await to(podcast.save());
  if (saveError) return next(saveError);

  return res.status(StatusCodes.OK).json({ success: true, message: "Schedule updated successfully", data: podcast });
};

const getAllDonePodcasts = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  if (page < 1 || limit < 1) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Page and limit must be positive integers",
    });
  }

  const [error, podcasts] = await to(
    Podcast.find({ status: PodcastStatus.DONE })
      .populate({ path: "primaryUser", select: "name avatar" })
      .populate({ path: "participants", select: "name avatar" })
      .skip(skip)
      .limit(limit)
      .lean()
  );

  if (error) return next(error);

  if (!podcasts || podcasts.length === 0) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "No podcasts found",
      data: {
        podcasts: [],
        pagination: {
          page,
          limit,
          totalPages: 0,
          totalPodcasts: 0,
        },
      },
    });
  }
  const totalPodcasts = await Podcast.countDocuments({ status: PodcastStatus.DONE });

  const totalPages = Math.ceil(totalPodcasts / limit);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Successfully retrieved podcasts",
    data: {
      podcasts,
      pagination: {
        page,
        limit,
        totalPages,
        totalPodcasts,
      },
    },
  });
};

const selectUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const podcastId = req.body.podcastId;
  const selectedUserId = req.body.selectedUserId;

  const [error, podcast] = await to(Podcast.findById(podcastId));
  if (error) return next(error);
  if (!podcast) return next(createError(StatusCodes.NOT_FOUND, "Podcast not found!"));

  podcast.selectedUser = selectedUserId;
  podcast.status = PodcastStatus.DONE;

  const [saveError] = await to(podcast.save());
  if (saveError) return next(saveError);

  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: podcast });
};

const PodcastServices = {
  getAllNotScheduledPodcasts,
  setSchedule,
  podcastDone,
  getAllDonePodcasts,
  selectUser,
};

export default PodcastServices;
