import TaC from "@models/tacModel";
import to from "await-to-ts";
import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { text } = req.body;
  const [error, tac] = await to(TaC.create({ text: text }));
  if (error) return next(error);
  res.status(StatusCodes.CREATED).json({ success: true, message: "Success", data: tac });
};

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const [error, tac] = await to(TaC.findOne().limit(1));
  if (error) return next(error);
  if (!tac) res.status(StatusCodes.OK).json({ success: true, message: "No Terms and Conditions", data: {} });
  res.status(StatusCodes.OK).json({ success: true, message: "Success", data: tac });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { text } = req.body;
  if (!text) return next(createError(StatusCodes.BAD_REQUEST, "No text provided"));

  const [error, tac] = await to(TaC.findOne());
  if (error) return next(error);
  if (!tac) return next(createError(StatusCodes.NOT_FOUND, "Terms and Condition not found"));
  tac.text = text;
  await tac.save();

  res.status(StatusCodes.OK).json({ success: true, message: "Success", data: tac });
};

const TaCController = {
  create,
  get,
  update
};

export default TaCController;
