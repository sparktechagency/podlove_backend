import { Request, Response, NextFunction } from "express";
import User from "@models/userModel";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import Cloudinary from "@shared/cloudinary";

const getAll = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { search, minAge, maxAge, gender, bodyType, ethnicity } = req.query;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  if (page < 1 || limit < 1) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Page and limit must be positive integers",
    });
  }

  let query: any = {};

  if (search) {
    query.$or = [{ name: { $regex: search, $options: "i" } }];
  }

  if (minAge || maxAge) {
    query.age = {};
    if (minAge) query.age.$gte = parseInt(minAge as string, 10);
    if (maxAge) query.age.$lte = parseInt(maxAge as string, 10);
  }

  const handleArrayQuery = (param: any) => {
    if (!param) return [];
    if (Array.isArray(param)) return param.map((p) => p.trim());
    return param.split(",").map((p: string) => p.trim());
  };

  const genderArray = handleArrayQuery(gender);
  if (genderArray.length) query.gender = { $in: genderArray };

  const bodyTypeArray = handleArrayQuery(bodyType);
  if (bodyTypeArray.length) query.bodyType = { $in: bodyTypeArray };

  const ethnicityArray = handleArrayQuery(ethnicity);
  if (ethnicityArray.length) query.ethnicity = { $in: ethnicityArray };

  const [users, total] = await Promise.all([
    User.find(query).populate({ path: "auth", select: "email isBlocked" }).lean().skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Successfully retrieved users information",
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    },
  });
};

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const user = await User.findById(req.user.userId).lean();
  if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found."));
  return res.status(StatusCodes.OK).json({ success: true, message: "User data retrieved successfully.", data: user });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const user = await User.findByIdAndUpdate(req.user.userId, { $set: req.body }, { new: true }).populate({
    path: "auth",
    select: "email",
  });
  if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found."));
  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: user });
};

const UserController = {
  get,
  getAll,
  update,
};

export default UserController;
