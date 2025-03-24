import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel";
import { StatusCodes } from "http-status-codes";
import SubscriptionPlan from "@models/subscriptionPlanModel";
import User from "@models/userModel";

const homeData = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;

  const user = await User.findById(userId).populate({ path: "auth", select: "email" });

  let podcast;
  podcast = await 
    Podcast.findOne({ primaryUser: userId }).populate({
      path: "participants",
      select: "name bio interests",
    }).lean();

  if (!podcast) podcast = {};

  const subscriptionPlans = await SubscriptionPlan.find().lean();

  return res
    .status(StatusCodes.OK)
    .json({ success: true, message: "Success", data: { user, podcast, subscriptionPlans } });
};

const HomeServices = {
  homeData,
};

export default HomeServices;
