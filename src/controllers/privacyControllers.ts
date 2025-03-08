import Privacy from "@models/privacyModel";
import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const privacy = await Privacy.findOne();
  return res.status(StatusCodes.OK).json({ success: true, message: "Privacy policy retrieved successfully", data: privacy });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { text } = req.body;
  if (!text) return next(createError(StatusCodes.BAD_REQUEST, "No text provided!"));
  const privacy = await Privacy.findOneAndUpdate({}, {text: text}, { new : true});
  return res.status(StatusCodes.OK).json({ success: true, message: "Privacy policy updated successfully", data: privacy });
};

const PrivacyController = {
  get,
  update
};

export default PrivacyController;
