import Analytics from "@models/analyticsModel";
import Podcast from "@models/podcastModel";
import User from "@models/userModel";
import { Months, SubscriptionPlanName } from "@shared/enums";
import to from "await-to-ts";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import createError from "http-errors";

const getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  let error, users, premiumUsers, totalIncomeResult, totalIncome, totalPodcast, analytics, premiumUsersIcome;

  [error, users] = await to(User.countDocuments());
  if (error) return next(error);

  [error, premiumUsers] = await to(
    User.countDocuments({ "subscription.plan": { $ne: SubscriptionPlanName.LISTENER } })
  );
  if (error) return next(error);
  [error, premiumUsersIcome] = await to(
    User.find({ "subscription.plan": { $ne: SubscriptionPlanName.LISTENER } })
      .select("subscription.fee")
      .lean()
  );
  if (error) return next(error);

  totalIncome = premiumUsersIcome.reduce<number>((sum, user) => {
    const rawFee = user.subscription?.fee;
    const feeStr = typeof rawFee === "string" ? rawFee : typeof rawFee === "number" ? String(rawFee) : "";
    const num = parseFloat(feeStr) || 0;
    return sum + num;
  }, 0);
  console.log("total incomde: ", totalIncome);
  [error, totalPodcast] = await to(Podcast.countDocuments());
  if (error) return next(error);

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

const getYearRange = (year: any) => {
  const startDate = new Date(`${year}-01-01`);

  const endDate = new Date(`${year}-12-31`);

  return { startDate, endDate };
};

const getMonthlySubscriptionGrowth = async (year?: number) => {
  try {
    const currentYear = new Date().getFullYear();
    const selectedYear = year || currentYear;

    const { startDate, endDate } = getYearRange(selectedYear);

    const monthlySubscriptionGrowth = await User.aggregate([
      // 1) only look at paid subscriptions in the date range
      {
        $match: {
          "subscription.fee": { $ne: "Free" },
          "subscription.startedAt": {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },

      // 2) bucket by month/year of subscription started date
      {
        $group: {
          _id: {
            month: { $month: "$subscription.startedAt" },
            year: { $year: "$subscription.startedAt" },
          },
          count: { $sum: 1 },
        },
      },

      // 3) reshape the output document
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
        },
      },

      // 4) sort first by year, then by month
      {
        $sort: { year: 1, month: 1 },
      },
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    console.log("monthlySubscriptionGrowth: ", monthlySubscriptionGrowth);

    const result = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlySubscriptionGrowth.find((data) => data.month === i + 1) || {
        month: i + 1,
        count: 0,
        year: selectedYear,
      };
      return {
        ...monthData,
        month: months[i],
      };
    });

    console.log("result: ", result);

    return {
      year: selectedYear,
      data: result,
    };
  } catch (error) {
    // Assuming logger is properly imported or defined elsewhere
    console.error("Error in getMonthlySubscriptionGrowth function: ", error);
    throw error;
  }
};
const getMonthlyUserGrowth = async (year?: number) => {
  try {
    const currentYear = new Date().getFullYear();
    const selectedYear = year || currentYear;

    const { startDate, endDate } = getYearRange(selectedYear);

    const monthlyUserGrowth = await User.aggregate([
      // 1) only users created in your date window
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      // 2) group them by month & year of creation
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      // 3) reshape the output
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
        },
      },
      // 4) sort chronologically
      {
        $sort: { year: 1, month: 1 },
      },
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    console.log("monthlySubscriptionGrowth: ", monthlyUserGrowth);

    const result = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlyUserGrowth.find((data) => data.month === i + 1) || {
        month: i + 1,
        count: 0,
        year: selectedYear,
      };
      return {
        ...monthData,
        month: months[i],
      };
    });

    console.log("result: ", result);

    return {
      year: selectedYear,
      data: result,
    };
  } catch (error) {
    // Assuming logger is properly imported or defined elsewhere
    console.error("Error in Monthly user Growth function: ", error);
    throw error;
  }
};

const getSubscriptionByYear = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  // const year = Number.parseInt(req.params.year);
  // const resultSubscription = getMonthlySubscriptionGrowth(year);
  // console.log("resultSubscription: ", resultSubscription);
  // return res.status(StatusCodes.OK).json({
  //   success: true,
  //   message: "Success",
  //   data: resultSubscription,
  // });
  try {
    // parse year, default to current if invalid
    const yr = parseInt(req.params.year, 10);
    const year = isNaN(yr) ? new Date().getFullYear() : yr;
    const resultSubscription = await getMonthlySubscriptionGrowth(year);
    // console.log("result subscriptioin: ", resultSubscription);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Monthly subscription growth for ${resultSubscription.year}`,
      data: resultSubscription.data,
    });
  } catch (err) {
    console.error("Error in getSubscriptionByYear:", err);
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to retrieve subscription analytics"));
  }
};
const getUserByYear = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  // const year = Number.parseInt(req.params.year);
  // const resultSubscription = getMonthlyUserGrowth(year);
  // return res.status(StatusCodes.OK).json({
  //   success: true,
  //   message: "Success",
  //   data: resultSubscription,
  // });
  try {
    // parse year, default to current if invalid
    const yr = parseInt(req.params.year, 10);
    const year = isNaN(yr) ? new Date().getFullYear() : yr;
    const resultUser = await getMonthlyUserGrowth(year);
    console.log("result user: ", resultUser);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Monthly user growth for ${resultUser.year}`,
      data: resultUser.data, 
    });
  } catch (err) {
    console.error("Error in getUserByYear:", err);
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to retrieve user growth analytics"));
  }
};

const AnalyticsController = {
  getAnalytics,
  getIncomeByYear,
  getSubscriptionByYear,
  getUserByYear,
};

export default AnalyticsController;
