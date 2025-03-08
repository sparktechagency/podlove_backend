import TaC from "@models/tacModel";
import to from "await-to-ts";
import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const tac = await TaC.findOne();
  return res.status(StatusCodes.OK).json({ success: true, message: "Terms and conditions retrieved successfully", data: tac });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { text } = req.body;
  if (!text) return next(createError(StatusCodes.BAD_REQUEST, "No text provided!"));
  const tac = await TaC.findOneAndUpdate({}, {text: text}, { new : true});
  return res.status(StatusCodes.OK).json({ success: true, message: "Terms and conditions updated successfully", data: tac });
};

const TaCController = {
  get,
  update
};

export default TaCController;
