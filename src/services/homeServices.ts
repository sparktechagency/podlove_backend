import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel";
import to from "await-to-ts";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import SubscriptionPlan from "@models/subscriptionPlanModel";
import User from "@models/userModel";

const homeData = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;
  let error, user, podcast, subscriptionPlans;

  [error, user] = await to(User.findById(userId).populate({path: "auth", select: "email"}));
  if(error) return next(error);

  [error, podcast] = await to(
    Podcast.findOne({ primaryUser: userId })
      .populate({
        path: "participant1",
        select: "name bio interests",
      })
      .populate({
        path: "participant2",
        select: "name bio interests",
      })
      .populate({
        path: "participant3",
        select: "name bio interests",
      })
  );
  if (error) return next(error);
  if (!podcast) return next(createError(StatusCodes.NOT_FOUND, "Podcast not found"));

  [error, subscriptionPlans] = await to(SubscriptionPlan.find().lean());
  if (error) return next(error);

  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: { user, podcast, subscriptionPlans } });
};

const HomeServices = {
  homeData,
};

export default HomeServices;
