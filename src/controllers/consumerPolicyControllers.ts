import ConsumerPolicy from "@models/consumerPolicyModel";
import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const consumerPolicy = await ConsumerPolicy.findOne();
  return res
    .status(StatusCodes.OK)
    .json({ success: true, message: "Consumer Policy retrieved successfully", data: consumerPolicy });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { text } = req.body;
  if (!text) return next(createError(StatusCodes.BAD_REQUEST, "No text provided!"));
  const consumerPolicy = await ConsumerPolicy.findOneAndUpdate({}, { text: text }, { new: true });
  return res
    .status(StatusCodes.OK)
    .json({ success: true, message: "Consumer Policy updated successfully", data: consumerPolicy });
};

const ConsumerPolicyController = {
  get,
  update,
};

export default ConsumerPolicyController;
