import { Request, Response, NextFunction } from "express";
import User from "@models/userModel";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import Cloudinary from "@shared/cloudinary";
import mongoose from "mongoose";

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

// const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
//   console.log("file", req.file);
//   const user = await User.findByIdAndUpdate(req.user.userId, { $set: req.body }, { new: true }).populate({
//     path: "auth",
//     select: "email",
//   });
//   if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found."));
//   return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: user });
// };

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw createError(StatusCodes.BAD_REQUEST, "Invalid user ID");
    }

    // Build an updates object with only allowed top-level fields
    const allowedFields = [
      "isProfileComplete",
      "name",
      "phoneNumber",
      "dateOfBirth",
      "gender",
      "bodyType",
      "ethnicity",
      "bio",
      "compatibility",
      "survey",
      "isSelectedForPodcast",
    ];
    const updates: any = {};

    console.log("req.body", req.body);
    // for testing purpoose add it will be validate with openai 
    updates.bio = req.body.text ? req.body.text.trim() : "";

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Parse nested JSON strings if sent via form-data
    if (req.body.personality) {
      updates.personality =
        typeof req.body.personality === "string" ? JSON.parse(req.body.personality) : req.body.personality;
    }
    if (req.body.interests) {
      updates.interests = typeof req.body.interests === "string" ? JSON.parse(req.body.interests) : req.body.interests;
    }
    if (req.body.location) {
      const loc = typeof req.body.location === "string" ? JSON.parse(req.body.location) : req.body.location;
      updates.location = {
        place: loc.place,
        longitude: Number(loc.longitude),
        latitude: Number(loc.latitude),
      };
    }
    if (req.body.preferences) {
      const pref = typeof req.body.preferences === "string" ? JSON.parse(req.body.preferences) : req.body.preferences;
      updates.preferences = {
        gender: pref.gender,
        age: { min: Number(pref.age.min), max: Number(pref.age.max) },
        bodyType: pref.bodyType,
        ethnicity: pref.ethnicity,
        distance: Number(pref.distance),
      };
    }
    if (req.body.subscription) {
      const sub = typeof req.body.subscription === "string" ? JSON.parse(req.body.subscription) : req.body.subscription;
      updates.subscription = {
        id: sub.id,
        plan: sub.plan,
        fee: sub.fee,
        status: sub.status,
        startedAt: new Date(sub.startedAt),
      };
    }

    // Handle avatar upload
    if (req.file) {
      // assuming Multer put the file in /uploads and req.file.filename is set
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    // Perform the update
    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, session })
      .populate({ path: "auth", select: "email" })
      .lean();

    if (!user) {
      throw createError(StatusCodes.NOT_FOUND, "User not found.");
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const UserController = {
  get,
  getAll,
  update,
};

export default UserController;
