"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tacModel_1 = __importDefault(require("../models/tacModel"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const http_errors_1 = __importDefault(require("http-errors"));
const http_status_codes_1 = require("http-status-codes");
const create = async (req, res, next) => {
    const { text } = req.body;
    const [error, tac] = await (0, await_to_ts_1.default)(tacModel_1.default.create({ text: text }));
    if (error)
        return next(error);
    res.status(http_status_codes_1.StatusCodes.CREATED).json({ success: true, message: "Success", data: tac });
};
const get = async (req, res, next) => {
    const [error, tac] = await (0, await_to_ts_1.default)(tacModel_1.default.findOne().limit(1));
    if (error)
        return next(error);
    if (!tac)
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "No Terms and Conditions", data: {} });
    res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: tac });
};
const update = async (req, res, next) => {
    const { text } = req.body;
    if (!text)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.BAD_REQUEST, "No text provided"));
    const [error, tac] = await (0, await_to_ts_1.default)(tacModel_1.default.findOne());
    if (error)
        return next(error);
    if (!tac)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Terms and Condition not found"));
    tac.text = text;
    await tac.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: tac });
};
const TaCController = {
    create,
    get,
    update
};
exports.default = TaCController;
