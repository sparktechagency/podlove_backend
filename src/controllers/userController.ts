import { Request, Response, NextFunction } from "express";
import User from "@models/userModel";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import Cloudinary from "@shared/cloudinary";
import mongoose from "mongoose";
import { ageToDOB } from "@utils/ageUtils";
import { upsertUserVector } from "@services/vectorService";
import { SubscriptionPlanName, SubscriptionStatus } from "@shared/enums";
import SubscriptionPlan from "@models/subscriptionPlanModel";

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
    //    query.age = {};
    //if (minAge) query.age.$gte = parseInt(minAge as string, 10);
    //if (maxAge) query.age.$lte = parseInt(maxAge as string, 10);
    query.dateOfBirth = {};
    if (minAge) {
      query.dateOfBirth.$lte = ageToDOB(parseInt(minAge as string, 10));
    }
    if (maxAge) {
      query.dateOfBirth.$gte = ageToDOB(parseInt(maxAge as string, 10));
    }
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

  const normalizeAuthIds = (users: Array<{ auth: any }>) =>
    users.map((u) => {
      let a = u.auth;
      if (typeof a === "string") {
        // match strings like "ObjectId('6888…')"
        const m = a.match(/^ObjectId\('([0-9a-fA-F]{24})'\)$/);
        if (m) {
          a = new mongoose.Types.ObjectId(m[1]);
        }
      }
      return { ...u, auth: a };
    });
  const [rawUsers, total] = await Promise.all([
    User.find(query).lean().skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);
  const usersWithObjectIds = normalizeAuthIds(rawUsers);

  // const [users, total] = await Promise.all([
  //   User.find(query).populate({ path: "auth", select: "email isBlocked" }).lean().skip(skip).limit(limit),
  //   User.countDocuments(query),
  // ]);
  const users = await User.populate(usersWithObjectIds, {
    path: "auth",
    select: "email isBlocked",
  });
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
//   // console.log("file", req.file);
//   const user = await User.findByIdAndUpdate(req.user.userId, { $set: req.body }, { new: true }).populate({
//     path: "auth",
//     select: "email",
//   });
//   if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found."));
//   return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: user });
// };

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  // console.log("req.body: ", req.body);
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw createError(StatusCodes.BAD_REQUEST, "Invalid user ID");
    }
    // console.log("req.body: ", req.body.location);
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
    ];
    const updates: any = {};

    console.log("req.body before processing user update: ", req.body);

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
    // if (req.body.preferences) {
    //   const pref = typeof req.body.preferences === "string" ? JSON.parse(req.body.preferences) : req.body.preferences;
    //   updates.preferences = {
    //     gender: pref.gender,
    //     age: { min: Number(pref.age.min), max: Number(pref.age.max) },
    //     bodyType: pref.bodyType,
    //     ethnicity: pref.ethnicity,
    //     distance: Number(pref.distance),
    //   };
    // }

    if (req.body.preferences) {
      const userWithPrefs = await User.findById(userId)
        .select("Preferences") // only include the Preferences field
        .lean();
      const pref: any =
        typeof req.body.preferences === "string" ? JSON.parse(req.body.preferences) : req.body.preferences;
      const age = pref.age && typeof pref.age === "object" ? pref.age : { min: undefined, max: undefined };
      const updateGender = pref.gender ? pref.gender : userWithPrefs?.preferences?.gender;
      updates.preferences = {
        gender: updateGender,
        age: {
          min: age.min != null ? Number(age.min) : undefined,
          max: age.max != null ? Number(age.max) : undefined,
        },
        bodyType: pref.bodyType,
        ethnicity: pref.ethnicity,
        distance: pref.distance != null ? Number(pref.distance) : undefined,
      };
    }
    if (req.body.subscription) {
      const sub = typeof req.body.subscription === "string" ? JSON.parse(req.body.subscription) : req.body.subscription;
      const timestamp = Date.parse(sub.startedAt);
      // // console.log("timestamp", timestamp);
      updates.subscription = {
        id: sub.id,
        plan: sub.plan,
        fee: sub.fee,
        status: sub.status,
        startedAt: new Date(timestamp || Date.now()),
      };
    }

    // Handle avatar upload
    if (req.file) {
      // assuming Multer put the file in /uploads and req.file.filename is set
      updates.avatar = `/uploads/images/${req.file.filename}`;
    }

    // Perform the update
    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, session }).populate({
      path: "auth",
      select: "email",
    });

    if (!user) {
      throw createError(StatusCodes.NOT_FOUND, "User not found.");
    }

    // Sync with Pinecone if profile is complete
    if (user.isProfileComplete) {
      try {
        await upsertUserVector(user);
      } catch (error) {
        console.error(`Failed to update vector for user ${userId}:`, error);
        // We don't fail the request if vector update fails, but we log it
      }
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

const updateUserSubscriptionController = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { userId } = req.params;
    const { subscriptionPlanId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!subscriptionPlanId) {
      return res.status(400).json({ message: "Invalid subscription plan ID" });
    }

    /** ✅ CASE 1: SAMPLER */
    if (user.subscription.plan === SubscriptionPlanName.SAMPLER) {
      const startedAt = new Date();
      const endDate = new Date(startedAt);
      endDate.setMonth(endDate.getMonth() + 1);

      // Using findByIdAndUpdate instead of user.save()
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            "subscription.status": SubscriptionStatus.ACTIVE,
            "subscription.startedAt": startedAt,
            "subscription.endDate": endDate
          }
        },
        { new: true }
      );
      if (!updatedUser) {
        return res.status(500).json({ message: "Subscription update failed" });
      }

      return res.status(200).json({
        success: true,
        message: "Sampler subscription activated",
        data: updatedUser.subscription,
      });
    }

    const plan = await SubscriptionPlan.findById(subscriptionPlanId);
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    const startedAt = new Date();
    const endDate = new Date(startedAt);
    endDate.setMonth(endDate.getMonth() + 1);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "subscription.subscription_id": plan._id,
          "subscription.plan": plan.name,
          "subscription.fee": "Free",
          "subscription.status": SubscriptionStatus.ACTIVE,
          "subscription.startedAt": startedAt,
          "subscription.endDate": endDate,
          "subscription.isSpotlight": 2,
        },
      },
      { new: true },
    ).lean();

    if (!updatedUser) {
      return res.status(500).json({ message: "Subscription update failed" });
    }

    return res.status(200).json({
      success: true,
      message: "Subscription activated successfully",
      data: update,
    });
  } catch (error) {
    next(error);
  }
};

const UserController = {
  get,
  getAll,
  update,
  updateUserSubscriptionController,
};

export default UserController;
