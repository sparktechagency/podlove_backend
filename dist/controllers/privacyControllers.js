"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const privacyModel_1 = __importDefault(require("../models/privacyModel"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const http_errors_1 = __importDefault(require("http-errors"));
const http_status_codes_1 = require("http-status-codes");
const create = async (req, res, next) => {
    const { text } = req.body;
    const [error, privacy] = await (0, await_to_ts_1.default)(privacyModel_1.default.create({ text }));
    if (error)
        return next(error);
    return res.status(http_status_codes_1.StatusCodes.CREATED).json({ success: true, message: "Success", data: privacy });
};
const get = async (req, res, next) => {
    const [error, privacy] = await (0, await_to_ts_1.default)(privacyModel_1.default.findOne().limit(1));
    if (error)
        return next(error);
    if (!privacy)
        return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "No privacy policy", data: {} });
    res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: privacy });
};
const update = async (req, res, next) => {
    const id = req.params.id;
    const { text } = req.body;
    if (!text)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.BAD_REQUEST, "No text provided"));
    const [error, privacy] = await (0, await_to_ts_1.default)(privacyModel_1.default.findByIdAndUpdate(id, { $set: { text: text } }, { new: true }));
    if (error)
        return next(error);
    if (!privacy)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Privacy policy not found"));
    res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: privacy });
};
const PrivacyController = {
    create,
    get,
    update,
};
exports.default = PrivacyController;
