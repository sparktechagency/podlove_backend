import { Request, Response, NextFunction } from "express";
import User from "@models/userModel";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import Cloudinary from "@shared/cloudinary";

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const user = await User.findById(req.user.userId).lean();
  if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found."));
  const data = {
    name: user.name,
    email: req.user.email,
    contact: user.phoneNumber,
    address: user.address,
    avatar: user.avatar
  };
  return res.status(StatusCodes.OK).json({ success: true, message: "User data retrieved successfully.", data: data });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const user = await User.findByIdAndUpdate(req.user.userId, { $set: req.body }, { new: true }).populate({path: "auth", select: "email"});
  if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found."));
  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: user });
};

const UserController = {
  get,
  update
};

export default UserController;
