"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const analyticsModel_1 = __importDefault(require("../models/analyticsModel"));
const podcastModel_1 = __importDefault(require("../models/podcastModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const enums_1 = require("../shared/enums");
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const http_status_codes_1 = require("http-status-codes");
const getAnalytics = async (req, res, next) => {
    let error, users, premiumUsers, totalIncomeResult, totalIncome, totalPodcast, analytics;
    [error, users] = await (0, await_to_ts_1.default)(userModel_1.default.countDocuments());
    if (error)
        return next(error);
    [error, premiumUsers] = await (0, await_to_ts_1.default)(userModel_1.default.countDocuments({ "subscription.plan": { $ne: enums_1.SubscriptionPlan.LISTENER } }));
    if (error)
        return next(error);
    [error, totalPodcast] = await (0, await_to_ts_1.default)(podcastModel_1.default.countDocuments());
    if (error)
        return next(error);
    [error, totalIncomeResult] = await (0, await_to_ts_1.default)(userModel_1.default.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: "$subscription.fee" }
            }
        }
    ]));
    if (error)
        return next(error);
    totalIncome = totalIncomeResult[0]?.total || 0;
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Success",
        data: {
            users,
            premiumUsers,
            totalIncome,
            totalPodcast
        }
    });
};
const getIncomeByYear = async (req, res, next) => {
    const year = Number.parseInt(req.params.year);
    const [error, analytics] = await (0, await_to_ts_1.default)(analyticsModel_1.default.find({ year }));
    if (error)
        return next(error);
    const allMonths = Object.values(enums_1.Months);
    const income = [];
    if (analytics.length === 0) {
        allMonths.forEach((month) => {
            income.push({ month: month, income: 0 });
        });
    }
    else {
        allMonths.forEach((month) => {
            const monthData = analytics.find((item) => item.month === month);
            if (monthData) {
                income.push({ month: month, income: monthData.income });
            }
            else {
                income.push({ month: month, income: 0 });
            }
        });
    }
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Success",
        data: income
    });
};
const getSubscriptionByYear = async (req, res, next) => {
    const year = Number.parseInt(req.params.year);
    const [error, analytics] = await (0, await_to_ts_1.default)(analyticsModel_1.default.find({ year }));
    if (error)
        return next(error);
    const allMonths = Object.values(enums_1.Months);
    const subscription = [];
    if (analytics.length === 0) {
        allMonths.forEach((month) => {
            subscription.push({ month: month, active: 0, cancel: 0 });
        });
    }
    else {
        allMonths.forEach((month) => {
            const monthData = analytics.find((item) => item.month === month);
            if (monthData) {
                subscription.push({ month: month, active: monthData.active, cancel: monthData.cancel });
            }
            else {
                subscription.push({ month: month, active: 0, cancel: 0 });
            }
        });
    }
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Success",
        data: subscription
    });
};
const AnalyticsController = {
    getAnalytics,
    getIncomeByYear,
    getSubscriptionByYear
};
exports.default = AnalyticsController;
