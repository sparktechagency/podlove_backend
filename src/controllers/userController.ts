import { Request, Response, NextFunction } from "express";
import User from "@models/userModel";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import Cloudinary from "@shared/cloudinary";

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;
  const email = req.user.email;
  let error, user;
  [error, user] = await to(User.findById(userId));
  if (error) return next(error);
  if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found."));
  const data = {
    name: user.name,
    email: email,
    contact: user.phoneNumber,
    address: user.address,
    avatar: user.avatar,
  };
  return res.status(StatusCodes.OK).json({ success: true, message: "User data retrieved successfully.", data: data });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { name, contact, address, avatarUrl } = req.body;
  const userId = req.user.userId;
  const email = req.user.email;
  let error, user;

  if (!name && !contact && !address && !avatarUrl) {
    return next(createError(StatusCodes.BAD_REQUEST, "At least one field should be updated."));
  }

  [error, user] = await to(User.findById(userId));
  if (error) return next(error);
  if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found."));

  user.name = name || user.name;
  user.phoneNumber = contact || user.phoneNumber;
  user.address = address || user.address;
  user.avatar = avatarUrl || user.avatar;

  [error] = await to(user.save());
  if (error) return next(error);

  const data = {
    name: user.name,
    email: email,
    contact: user.phoneNumber,
    address: user.address,
    avatar: user.avatar,
  };

  return res.status(StatusCodes.OK).json({ success: true, message: "User updated successfully.", data: data });
};

const UserController = {
  get,
  update,
};

export default UserController;
