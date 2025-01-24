import { Request, Response, NextFunction } from "express";
import Support from "@models/supportModel";
import createError from "http-errors";
import to from "await-to-ts";
import { StatusCodes } from "http-status-codes";

const reply = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { supportId, reply } = req.body;
  const [error, support] = await to(Support.findById(supportId));
  if (error) return next(error);
  if (!support) return next(createError(StatusCodes.NOT_FOUND, "Support not found"));
  support.reply = reply;
  const [saveError] = await to(support.save());
  if (saveError) return next(saveError);
  res.status(StatusCodes.OK).json({ success: true, message: "Success", data: support });
};

const SupportServices = {
  reply,
};

export default SupportServices;
