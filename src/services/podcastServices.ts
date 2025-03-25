import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel"; // Adjust the import path as necessary
import { PodcastStatus } from "@shared/enums";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import createError from "http-errors";

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
  setSchedule,
  podcastDone,
  selectUser,
};

export default PodcastServices;
