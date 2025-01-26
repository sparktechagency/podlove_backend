"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supportModel_1 = __importDefault(require("../models/supportModel"));
const http_errors_1 = __importDefault(require("http-errors"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const http_status_codes_1 = require("http-status-codes");
const reply = async (req, res, next) => {
    const { supportId, reply } = req.body;
    const [error, support] = await (0, await_to_ts_1.default)(supportModel_1.default.findById(supportId));
    if (error)
        return next(error);
    if (!support)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Support not found"));
    support.reply = reply;
    const [saveError] = await (0, await_to_ts_1.default)(support.save());
    if (saveError)
        return next(saveError);
    res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: support });
};
const SupportServices = {
    reply,
};
exports.default = SupportServices;
