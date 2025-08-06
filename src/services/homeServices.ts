import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel";
import { StatusCodes } from "http-status-codes";
import SubscriptionPlan from "@models/subscriptionPlanModel";
import User from "@models/userModel";
import mongoose, { ClientSession, Types } from "mongoose";
import createError from "http-errors";
import { LeanUserWithAuth } from "@shared/homeInterface";
interface ParticipantUI {
  _id: Types.ObjectId; // stringify for JSON
  score: number;
  name: string;
  bio: string;
  interests: string[];
}

interface HostSummary {
  _id: Types.ObjectId;
  name: string;
  bio: string;
  interests: string[];
  score: number;
}

function summarizeSelectedUserPodcasts(podcasts: any): HostSummary[] {
  return podcasts.map(
    (p: { primaryUser: { _id: any; name: any; bio: any; interests: any }; participants: { score: number }[] }) => {
      const { _id, name, bio, interests } = p.primaryUser;
      const score = p.participants[0]?.score ?? 0;
      return { _id, name, bio, interests, score };
    }
  );
}

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

// interface LeanUserWithAuth {
//   _id: Types.ObjectId;
//   auth: {
//     _id: Types.ObjectId;
//     email: string;
//     isBlocked: boolean;
//   };
//   // …any other fields you need
// }

const homeData = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user.userId;
    const userObjId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
    console.log("userId: ", userId, " userObjId: ", userObjId);
    // Fetch the user (with their auth email)
    const user = await User.findById(userId).populate({ path: "auth", select: "email isBlocked" }).lean<LeanUserWithAuth>();
    console.log("user home: ", user);
    if(!user){
      throw next(createError(StatusCodes.NOT_FOUND, "You account is not found"));
    }
    if(user.auth.isBlocked){
      throw next(createError(StatusCodes.FORBIDDEN, "You Account is Blocked by Admisnistrator, Please contact our assistance"))
    }
    
    // console.log("")

    // Find the podcast where they’re primary or a participant
    const podcast = await Podcast.findOne({
      $or: [{ primaryUser: userId }, { "participants.user": userId }],
    })
      .populate({ path: "participants.user", select: "name bio interests" })
      .populate({ path: "primaryUser", select: "name bio interests" })
      .lean();
    const isPrimaryUser = !!podcast && podcast.primaryUser._id.toString() === userId;
    if (!podcast) {
      throw new Error("podcast is null");
    }

    const selectedUserPodcast = await Podcast.find({ "selectedUser.user": userObjId })
      .populate({ path: "participants.user", select: "name bio interests" })
      .populate({ path: "primaryUser", select: "name bio interests" })
      .lean();

    const hostSummaries = summarizeSelectedUserPodcasts(selectedUserPodcast);
    const participantsArray = podcast?.participants.map((participant) => {
      const { user, score, isAllow } = participant;

      return {
        ...user,
        isAllow,
        score,
      };
    });

    if (hostSummaries.length > 0) {
      hostSummaries.forEach((h) => {
        participantsArray.push({
          _id: h._id,
          score: h.score,
          isAllow: true,
          name: h.name,
          bio: h.bio,
          interests: h.interests,
        } as any); // ← bypasses the type‑checker
      });

      hostSummaries.forEach((h) => {
        return (podcast as any).selectedUser.push({
          _id: h._id,
          user: h._id,
        } as any);
      });
    }
    podcast.participants = participantsArray as unknown as typeof podcast.participants;
    // Fetch available subscription plans
    const subscriptionPlans = await SubscriptionPlan.find().lean();

    const hostPodcastMatches = await Podcast.find({
      status: { $in: ["Scheduled", "Playing"] },
      "participants.user": userObjId,
    }).exec();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Success",
      data: {
        user,
        podcast: podcast || {},
        subscriptionPlans,
        isPrimaryUser,
        hostPodcastMatches,
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
