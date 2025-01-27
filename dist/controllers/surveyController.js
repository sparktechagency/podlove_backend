"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const surveyModel_1 = __importDefault(require("../models/surveyModel"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const http_status_codes_1 = require("http-status-codes");
const create = async (req, res, next) => {
    const userId = req.user.userId;
    const { first, second, third, fourth, fifth, six, seven, eight, nine, ten, eleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen } = req.body;
    const [error, survey] = await (0, await_to_ts_1.default)(surveyModel_1.default.create({
        user: userId,
        first,
        second,
        third,
        fourth,
        fifth,
        six,
        seven,
        eight,
        nine,
        ten,
        eleven,
        twelve,
        thirteen,
        fourteen,
        fifteen,
        sixteen,
        seventeen,
        eighteen,
        nineteen
    }));
    if (error)
        return next(error);
    res.status(http_status_codes_1.StatusCodes.CREATED).json({
        success: true,
        message: "Survey created successfully",
        data: survey
    });
};
const get = async (req, res, next) => {
    const userId = req.params.id;
    const [error, survey] = await (0, await_to_ts_1.default)(surveyModel_1.default.findOne({ user: userId }));
    if (error)
        return next(error);
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Surveys retrieved successfully",
        data: survey
    });
};
const SurveyController = {
    create,
    get
};
exports.default = SurveyController;
