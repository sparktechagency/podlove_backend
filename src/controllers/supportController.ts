import { Request, Response, NextFunction } from "express";
import Support from "@models/supportModel";
import createError from "http-errors";
import User from "@models/userModel";
import to from "await-to-ts";
import { StatusCodes } from "http-status-codes";

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { userId, description } = req.body;

  let error, user, support;
  [error, user] = await to(User.findById(userId));
  if (error) return next(error);
  if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found"));

  [error, support] = await to(
    Support.create({ user: userId, userName: user.name, userAvatar: user.avatar, description, date: Date.now() })
  );
  if (error) return next(error);

  return res.status(StatusCodes.CREATED).json({ success: true, message: "Success", data: support });
};

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  const [error, support] = await to(Support.findById(id).lean());
  if (error) return next(error);
  if (!support) return next(createError(StatusCodes.NOT_FOUND, "Support not found"));
  return res.status(StatusCodes.ACCEPTED).json({ success: true, message: "Success", data: support });
};

const getAll = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const [error, supports] = await to(Support.find().lean());
  if (error) return next(error);
  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: { supports: supports || [] } });
};
