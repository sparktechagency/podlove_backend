"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const podcastModel_1 = __importDefault(require("../models/podcastModel"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const http_errors_1 = __importDefault(require("http-errors"));
const http_status_codes_1 = require("http-status-codes");
const subscriptionPlanModel_1 = __importDefault(require("../models/subscriptionPlanModel"));
const homeData = async (req, res, next) => {
    const userId = req.user.userId;
    let error, podcast, subscriptionPlans;
    [error, podcast] = await (0, await_to_ts_1.default)(podcastModel_1.default.findOne({ primaryUser: userId })
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
    }));
    if (error)
        return next(error);
    if (!podcast)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Podcast not found"));
    [error, subscriptionPlans] = await (0, await_to_ts_1.default)(subscriptionPlanModel_1.default.find().lean());
    if (error)
        return next(error);
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: { podcast, subscriptionPlans } });
};
const HomeServices = {
    homeData,
};
exports.default = HomeServices;
