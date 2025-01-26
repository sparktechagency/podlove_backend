import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import createError from "http-errors";

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { primaryUser, participant1, participant2, participant3 } = req.body;
  const [error, podcast] = await to(Podcast.create({ primaryUser, participant1, participant2, participant3 }));
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
  getAll
};

export default PodcastController;