import { Request, Response, NextFunction } from "express";
import User from "@models/userModel";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import createError from "http-errors";
import Auth from "@models/authModel";

const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  if (page < 1 || limit < 1) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Page and limit must be positive integers",
    });
  }

  const [error, [users, totalUsers]] = await to(
    Promise.all([
      User.find()
        .populate({ path: "auth isBlocked", select: "email" })
        .select("name phoneNumber gender age address survey")
        .lean()
        .skip(skip)
        .limit(limit),
      User.countDocuments(),
    ])
  );

  if (error) return next(error);

  if (!users || users.length === 0) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "No users found",
      data: {
        users: [],
        pagination: {
          page,
          limit,
          totalPages: 0,
          totalUsers: 0,
        },
      },
    });
  }

  const totalPages = Math.ceil(totalUsers / limit);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Successfully retrieved users information",
    data: {
      users,
      pagination: {
        page,
        limit,
        totalPages,
        totalUsers,
      },
    },
  });
};

const block = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const authId = req.params.authId;
  const [error, auth] = await to(Auth.findById(authId));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User not found"));

  auth.isBlocked = true;
  await auth.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "User blocked successfully",
    data: { isBlocked: auth.isBlocked },
  });
};

const unblock = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const authId = req.params.authId;
  const [error, auth] = await to(Auth.findById(authId));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User not found"));

  auth.isBlocked = false;
  await auth.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "User blocked successfully",
    data: { isBlocked: auth.isBlocked },
  });
};

const UserServices = {
  getAllUsers,
  block,
  unblock,
};

export default UserServices;
