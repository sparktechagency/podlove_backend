import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import createError from "http-errors";
import MatchedServices from "@services/matchesServices";
import { SubscriptionPlanName } from "@shared/enums";
import User from "@models/userModel";
import { Types } from "mongoose";

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;
  let error, participants, podcast, user, matchCount;

  [error, user] = await to(User.findById(userId));
  if (error) return next(error);

  if (user?.subscription.plan === SubscriptionPlanName.LISTENER) matchCount = 2;
  else if (user?.subscription.plan === SubscriptionPlanName.SPEAKER) matchCount = 3;
  else matchCount = 4;

  [error, participants] = await to(MatchedServices.match(userId, matchCount));
  if (error) return;

  const participantsObjectIds = participants.map((id: string) => new Types.ObjectId(id));

  [error, podcast] = await to(Podcast.create({ primaryUser: userId, participants: participantsObjectIds }));
  if (error) return next(error);

  return res.status(StatusCodes.CREATED).json({ success: true, message: "Success", data: podcast });
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
  getAll,
};

export default PodcastController;
