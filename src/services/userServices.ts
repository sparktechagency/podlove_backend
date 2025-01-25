import { Request, Response, NextFunction } from "express";
import User from "@models/userModel";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import createError from "http-errors";
import Auth from "@models/authModel";
import { SubscriptionPlan } from "@shared/enums";

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

const getAllPremiumSubscribers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
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
      User.find({ "subscription.plan": { $ne: SubscriptionPlan.LISTENER } })
        .select("name subscription")
        .lean()
        .skip(skip)
        .limit(limit),
      User.countDocuments({ "subscription.plan": { $ne: SubscriptionPlan.LISTENER } }),
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

const searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { query } = req.query;

  if (!query) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Query parameter is required",
      data: {},
    });
  }

  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: "auths",
          localField: "auth",
          foreignField: "_id",
          as: "authDetails",
        },
      },
      {
        $unwind: {
          path: "$authDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            { "authDetails.email": { $regex: query, $options: "i" } },
            { name: { $regex: query, $options: "i" } },
            { phoneNumber: { $regex: query, $options: "i" } },
            { gender: query },
            { address: { $regex: query, $options: "i" } },
          ],
        },
      },
      {
        $project: {
          name: 1,
          phoneNumber: 1,
          gender: 1,
          age: 1,
          address: 1,
          survey: 1,
          "authDetails.email": 1,
          "authDetails.isBlocked": 1,
        },
      },
    ]);

    if (!users || users.length === 0) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "No users found",
        data: {
          users: [],
        },
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Successfully retrieved users information",
      data: {
        users,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const searchPremiumUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { query } = req.query; // Extract the search query from the request

  if (!query) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Query parameter is required",
      data: {},
    });
  }

  try {
    const users = await User.find({
      "subscription.plan": { $ne: SubscriptionPlan.LISTENER },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { "subscription.plan": { $regex: query, $options: "i" } },
        { "subscription.fee": query },
        { "subscription.status": { $regex: query, $options: "i" } },
      ],
    })
      .select("name subscription")
      .lean();

    if (!users || users.length === 0) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "No premium users found",
        data: {
          users: [],
        },
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Successfully retrieved premium users information",
      data: {
        users,
      },
    });
  } catch (error) {
    return next(error);
  }
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
  getAllPremiumSubscribers,
  searchUsers,
  searchPremiumUsers,
  block,
  unblock,
};

export default UserServices;
