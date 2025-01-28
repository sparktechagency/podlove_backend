"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const podcastModel_1 = __importDefault(require("../models/podcastModel"));
const http_status_codes_1 = require("http-status-codes");
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const http_errors_1 = __importDefault(require("http-errors"));
const matchesServices_1 = __importDefault(require("../services/matchesServices"));
const create = async (req, res, next) => {
    const { primaryUser } = req.body;
    let error, participants, podcast;
    [error, participants] = await (0, await_to_ts_1.default)(matchesServices_1.default.match(primaryUser));
    if (error)
        return;
    const participant1 = participants[0];
    const participant2 = participants[1];
    const participant3 = participants[2];
    [error, podcast] = await (0, await_to_ts_1.default)(podcastModel_1.default.create({ primaryUser, participant1, participant2, participant3 }));
    if (error)
        return next(error);
    return res.status(http_status_codes_1.StatusCodes.CREATED).json({ success: true, message: "Success", data: podcast });
};
const get = async (req, res, next) => {
    const { id } = req.params;
    const [error, podcast] = await (0, await_to_ts_1.default)(podcastModel_1.default.findById(id).lean());
    if (error)
        return next(error);
    if (!podcast)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Podcast not found"));
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: podcast });
};
const getAll = async (req, res, next) => {
    const [error, podcasts] = await (0, await_to_ts_1.default)(podcastModel_1.default.find().lean());
    if (error)
        return next(error);
    if (!podcasts || podcasts.length === 0)
        return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "No podcast found", data: { podcasts: [] } });
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: { podcasts: podcasts } });
};
const PodcastController = {
    create,
    get,
    getAll
};
exports.default = PodcastController;
