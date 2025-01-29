import Analytics from "@models/analyticsModel";
import Podcast from "@models/podcastModel";
import User from "@models/userModel";
import { Months, SubscriptionPlanName } from "@shared/enums";
import to from "await-to-ts";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

const getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  let error, users, premiumUsers, totalIncomeResult, totalIncome, totalPodcast, analytics;

  [error, users] = await to(User.countDocuments());
  if (error) return next(error);

  [error, premiumUsers] = await to(
    User.countDocuments({ "subscription.plan": { $ne: SubscriptionPlanName.LISTENER } })
  );
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

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Success",
    data: {
      users,
      premiumUsers,
      totalIncome,
      totalPodcast,
    },
  });
};

const getIncomeByYear = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const year = Number.parseInt(req.params.year);
  const [error, analytics] = await to(Analytics.find({ year }));
  if (error) return next(error);
  const allMonths = Object.values(Months);
  const income: any = [];
  if (analytics.length === 0) {
    allMonths.forEach((month) => {
      income.push({ month: month, income: 0 });
    });
  } else {
    allMonths.forEach((month) => {
      const monthData = analytics.find((item) => item.month === month);
      if (monthData) {
        income.push({ month: month, income: monthData.income });
      } else {
        income.push({ month: month, income: 0 });
      }
    });
  }
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Success",
    data: income,
  });
};

const getSubscriptionByYear = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const year = Number.parseInt(req.params.year);
  const [error, analytics] = await to(Analytics.find({ year }));
  if (error) return next(error);

  const allMonths = Object.values(Months);

  const subscription: any = [];

  if (analytics.length === 0) {
    allMonths.forEach((month) => {
      subscription.push({ month: month, active: 0, cancel: 0 });
    });
  } else {
    allMonths.forEach((month) => {
      const monthData = analytics.find((item) => item.month === month);
      if (monthData) {
        subscription.push({ month: month, active: monthData.active, cancel: monthData.cancel });
      } else {
        subscription.push({ month: month, active: 0, cancel: 0 });
      }
    });
  }
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Success",
    data: subscription,
  });
};

const AnalyticsController = {
  getAnalytics,
  getIncomeByYear,
  getSubscriptionByYear,
};

export default AnalyticsController;
