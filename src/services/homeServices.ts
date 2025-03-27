import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel";
import { StatusCodes } from "http-status-codes";
import SubscriptionPlan from "@models/subscriptionPlanModel";
import User from "@models/userModel";

const homeData = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;

  const user = await User.findById(userId).populate({ path: "auth", select: "email" });

  let podcast = await Podcast.findOne({
    $or: [{ primaryUser: userId }, { participants: userId }],
  })
    .populate({
      path: "participants",
      select: "name bio interests",
    })
    .populate({
      path: "primaryUser",
      select: "name bio interests",
    })
    .lean();

  const isPrimaryUser = podcast ? podcast.primaryUser.toString() === userId : false;

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
};


const HomeServices = {
  homeData,
};

export default HomeServices;
