import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel";
import { StatusCodes } from "http-status-codes";
import SubscriptionPlan from "@models/subscriptionPlanModel";
import User from "@models/userModel";
import { Types } from "mongoose";

type ParticipantWithId = {
  user: Types.ObjectId;
  score: number;
  _id: Types.ObjectId;
};

// const homeData = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
//   const userId = req.user.userId;

//   const user = await User.findById(userId).populate({ path: "auth", select: "email" });

//   let podcast = await Podcast.findOne({
//     $or: [{ primaryUser: userId }, { participants: userId }],
//   })
//     .populate({
//       path: "participants",
//       select: "name bio interests",
//     })
//     .populate({
//       path: "primaryUser",
//       select: "name bio interests",
//     })
//     .lean();

//   const isPrimaryUser = podcast ? podcast.primaryUser.toString() === userId : false;

//   const subscriptionPlans = await SubscriptionPlan.find().lean();

//   return res.status(StatusCodes.OK).json({
//     success: true,
//     message: "Success",
//     data: {
//       user,
//       podcast: podcast || {},
//       subscriptionPlans,
//       isPrimaryUser,
//     },
//   });
// };

const homeData = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user.userId;

    // Fetch the user (with their auth email)
    const user = await User.findById(userId).populate({ path: "auth", select: "email" }).lean();

    // Find the podcast where they’re primary or a participant
    const podcast = await Podcast.findOne({
      $or: [{ primaryUser: userId }, { "participants.user": userId }],
    })
      .populate({ path: "participants.user", select: "name bio interests" })
      .populate({ path: "primaryUser", select: "name bio interests" })
      .lean();

    const isPrimaryUser = !!podcast && podcast.primaryUser.toString() === userId;

    if (!podcast) {
      throw new Error("podcast is null");
    }

      const participantsArray = podcast?.participants.map((participant) => {
      const { user, score } = participant;
      const _id = (participant as any)._id; // <-- cast to any so TS stops complaining

      return {
        ...user,
        score,
        _id,
      };
    });

    podcast.participants = (participantsArray as unknown) as typeof podcast.participants;
     console.log("podcast: ",podcast)
    // Fetch available subscription plans
    const subscriptionPlans = await SubscriptionPlan.find().lean();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Success",
      data: {
        user,
        podcast: podcast || {},
        subscriptionPlans,
        isPrimaryUser,
      },
    });
  } catch (err) {
    // Forward the error to your error‑handling middleware
    next(err);
  }
};

const HomeServices = {
  homeData,
};

export default HomeServices;
