"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const podcastModel_1 = __importDefault(require("../models/podcastModel")); // Adjust the import path as necessary
const enums_1 = require("../shared/enums");
const http_status_codes_1 = require("http-status-codes");
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const http_errors_1 = __importDefault(require("http-errors"));
const getAllNotScheduledPodcasts = async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    if (page < 1 || limit < 1) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Page and limit must be positive integers"
        });
    }
    const [error, podcasts] = await (0, await_to_ts_1.default)(podcastModel_1.default.find({ status: { $in: [enums_1.PodcastStatus.NOT_SCHEDULED, enums_1.PodcastStatus.SCHEDULED] } })
        .populate({ path: "primaryUser", select: "name avatar" })
        .populate({ path: "participant1", select: "name avatar" })
        .populate({ path: "participant2", select: "name avatar" })
        .populate({ path: "participant3", select: "name avatar" })
        .skip(skip)
        .limit(limit)
        .lean());
    if (error)
        return next(error);
    if (!podcasts || podcasts.length === 0) {
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "No podcasts found",
            data: {
                podcasts: [],
                pagination: {
                    page,
                    limit,
                    totalPages: 0,
                    totalPodcasts: 0
                }
            }
        });
    }
    const totalPodcasts = await podcastModel_1.default.countDocuments({ status: enums_1.PodcastStatus.NOT_SCHEDULED });
    const totalPages = Math.ceil(totalPodcasts / limit);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Successfully retrieved podcasts",
        data: {
            podcasts,
            pagination: {
                page,
                limit,
                totalPages,
                totalPodcasts
            }
        }
    });
};
const podcastDone = async (req, res, next) => {
    const podcastId = req.body.podcastId;
    const [error, podcast] = await (0, await_to_ts_1.default)(podcastModel_1.default.findById(podcastId));
    if (error)
        return next(error);
    if (!podcast)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Podcast not found"));
    podcast.status = enums_1.PodcastStatus.DONE;
    const [saveError] = await (0, await_to_ts_1.default)(podcast.save());
    if (saveError)
        return next(saveError);
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: { status: podcast.status } });
};
const setSchedule = async (req, res, next) => {
    const { podcastId, date, time } = req.body;
    const [error, podcast] = await (0, await_to_ts_1.default)(podcastModel_1.default.findById(podcastId));
    if (error)
        return next(error);
    if (!podcast)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Podcast not found!"));
    podcast.schedule.date = date;
    podcast.schedule.time = time;
    podcast.status = enums_1.PodcastStatus.SCHEDULED;
    const [saveError] = await (0, await_to_ts_1.default)(podcast.save());
    if (saveError)
        return next(saveError);
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Schedule updated successfully", data: podcast });
};
const getAllDonePodcasts = async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    if (page < 1 || limit < 1) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Page and limit must be positive integers"
        });
    }
    const [error, podcasts] = await (0, await_to_ts_1.default)(podcastModel_1.default.find({ status: enums_1.PodcastStatus.DONE })
        .populate({ path: "primaryUser", select: "name avatar" })
        .populate({ path: "participant1", select: "name avatar" })
        .populate({ path: "participant2", select: "name avatar" })
        .populate({ path: "participant3", select: "name avatar" })
        .skip(skip)
        .limit(limit)
        .lean());
    if (error)
        return next(error);
    if (!podcasts || podcasts.length === 0) {
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "No podcasts found",
            data: {
                podcasts: [],
                pagination: {
                    page,
                    limit,
                    totalPages: 0,
                    totalPodcasts: 0
                }
            }
        });
    }
    const totalPodcasts = await podcastModel_1.default.countDocuments({ status: enums_1.PodcastStatus.DONE });
    const totalPages = Math.ceil(totalPodcasts / limit);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Successfully retrieved podcasts",
        data: {
            podcasts,
            pagination: {
                page,
                limit,
                totalPages,
                totalPodcasts
            }
        }
    });
};
const selectUser = async (req, res, next) => {
    const podcastId = req.body.podcastId;
    const selectedUserId = req.body.selectedUserId;
    const [error, podcast] = await (0, await_to_ts_1.default)(podcastModel_1.default.findById(podcastId));
    if (error)
        return next(error);
    if (!podcast)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Podcast not found!"));
    podcast.selectedUser = selectedUserId;
    podcast.status = enums_1.PodcastStatus.DONE;
    const [saveError] = await (0, await_to_ts_1.default)(podcast.save());
    if (saveError)
        return next(saveError);
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: podcast });
};
const PodcastServices = {
    getAllNotScheduledPodcasts,
    setSchedule,
    podcastDone,
    getAllDonePodcasts,
    selectUser
};
exports.default = PodcastServices;
