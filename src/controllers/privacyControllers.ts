import Privacy from "@models/privacyModel";
import to from "await-to-ts";
import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { text } = req.body;
  const [error, privacy] = await to(Privacy.create({ text }));
  if (error) return next(error);
  return res.status(StatusCodes.CREATED).json({ success: true, message: "Success", data: privacy });
};

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const [error, privacy] = await to(Privacy.findOne().limit(1));
  if (error) return next(error);
  if (!privacy) return res.status(StatusCodes.OK).json({ success: true, message: "No privacy policy", data: {} });
  res.status(StatusCodes.OK).json({ success: true, message: "Success", data: privacy });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { text } = req.body;

  if (!text) return next(createError(StatusCodes.BAD_REQUEST, "No text provided"));

  const [error, privacy] = await to(Privacy.findOne());
  if (error) return next(error);
  if (!privacy) return next(createError(StatusCodes.NOT_FOUND, "Privacy policy not found"));

  privacy.text = text;
  await privacy.save();

  res.status(StatusCodes.OK).json({ success: true, message: "Success", data: privacy });
};

const PrivacyController = {
  create,
  get,
  update
};

export default PrivacyController;
