import Analytics from "@models/analyticsModel";
import Podcast from "@models/podcastModel";
import User from "@models/userModel";
import { Months, SubscriptionPlan } from "@shared/enums";
import to from "await-to-ts";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

const getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const year = Number.parseInt(req.params.year);

  let error, users, premiumUsers, totalIncomeResult, totalIncome, totalPodcast, analytics;

  [error, users] = await to(User.countDocuments());
  if (error) return next(error);

  [error, premiumUsers] = await to(User.countDocuments({ "subscription.plan": { $ne: SubscriptionPlan.LISTENER } }));
  if (error) return next(error);

  [error, totalPodcast] = await to(Podcast.countDocuments());
  if (error) return next(error);

  [error, totalIncomeResult] = await to(
    User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$subscription.fee" },
        },
      },
    ])
  );
  if (error) return next(error);

  totalIncome = totalIncomeResult[0]?.total || 0;

  const allMonths = Object.values(Months);

  [error, analytics] = await to(Analytics.find({ year }));
  if (error) return next(error);

  const incomeArray: any = [];
  const subscriptionArray: any = [];

  if (analytics.length === 0) {
    allMonths.forEach((month) => {
      incomeArray.push({ month: month, income: 0 });
      subscriptionArray.push({ month: month, active: 0, cancel: 0 });
    });
  } else {
    allMonths.forEach((month) => {
      const monthData = analytics.find((item) => item.month === month);
      if (monthData) {
        incomeArray.push({ month: month, income: monthData.income });
        subscriptionArray.push({ month: month, active: monthData.active, cancel: monthData.cancel });
      } else {
        incomeArray.push({ month: month, income: 0 });
        subscriptionArray.push({ month: month, active: 0, cancel: 0 });
      }
    });
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Success",
    data: {
      users,
      premiumUsers,
      totalIncome,
      totalPodcast,
      incomeArray,
      subscriptionArray,
    },
  });
};

const AnalyticsController = {
  getAnalytics,
};

export default AnalyticsController;
