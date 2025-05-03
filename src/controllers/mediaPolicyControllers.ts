import MediaPolicy from "@models/mediaPolicyModel";
import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const mediaPolicy = await MediaPolicy.findOne();
  return res
    .status(StatusCodes.OK)
    .json({ success: true, message: "Media Policy retrieved successfully", data: mediaPolicy });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { text } = req.body;
  if (!text) return next(createError(StatusCodes.BAD_REQUEST, "No text provided!"));
  const mediaPolicy = await MediaPolicy.findOneAndUpdate({}, { text: text }, { new: true });
  return res
    .status(StatusCodes.OK)
    .json({ success: true, message: "Media Policy updated successfully", data: mediaPolicy });
};

const MediaPolicyController = {
  get,
  update,
};

export default MediaPolicyController;
