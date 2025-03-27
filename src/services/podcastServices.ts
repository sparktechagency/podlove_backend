import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel"; // Adjust the import path as necessary
import { PodcastStatus } from "@shared/enums";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import createError from "http-errors";

// const podcastActions = async(req: Request, res: Response, next: NextFunction) : Promise<any> => {
//   const { podcastId, status, selectedUserId, schedule } = req.body;

//   if (!podcastId) {
//     return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "podcastId is required" });
//   }

//   const podcast = await Podcast.findById(podcastId);
//   if (!podcast) throw createError(StatusCodes.NOT_FOUND, "Podcast not found");

//   if (schedule) {
//     const { date, day, time } = schedule;
//     if (date) podcast.schedule.date = date;
//     if (day) podcast.schedule.day = day;
//     if (time) podcast.schedule.time = time;
//     podcast.status = PodcastStatus.SCHEDULED;
//   }

//   if (selectedUserId) {
//     podcast.selectedUser = selectedUserId;
//     podcast.status = PodcastStatus.DONE;
//   }

//   if (status) {
//     podcast.status = status;
//   }

//   const [saveError] = await to(podcast.save());
//   if (saveError) return next(saveError);

//   return res.status(StatusCodes.OK).json({
//     success: true,
//     message: "Podcast updated successfully",
//     data: podcast,
//   });
// };


const podcastDone = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const podcastId = req.body.podcastId;
  const  podcast = await Podcast.findById(podcastId);
  if (!podcast) throw createError(StatusCodes.NOT_FOUND, "Podcast not found");

  podcast.status = PodcastStatus.DONE;
  await podcast.save();

  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: { status: podcast.status } });
};

const setSchedule = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { podcastId, date, day, time } = req.body;

  const podcast  = await Podcast.findById(podcastId);
  if (!podcast) throw createError(StatusCodes.NOT_FOUND, "Podcast not found!");

  podcast.schedule.date = date;
  podcast.schedule.day = day;
  podcast.schedule.time = time;
  podcast.status = PodcastStatus.SCHEDULED;

  await podcast.save();
  
  return res.status(StatusCodes.OK).json({ success: true, message: "Schedule updated successfully", data: podcast });
};


const selectUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const podcastId = req.body.podcastId;
  const selectedUserId = req.body.selectedUserId;

  const podcast = await Podcast.findById(podcastId);
  if (!podcast) throw createError(StatusCodes.NOT_FOUND, "Podcast not found!");

  podcast.selectedUser = selectedUserId;
  podcast.status = PodcastStatus.DONE;

  await podcast.save();
  
  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: podcast });
};

const PodcastServices = {
  setSchedule,
  podcastDone,
  selectUser,
};

export default PodcastServices;
