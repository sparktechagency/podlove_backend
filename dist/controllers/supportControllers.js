"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supportModel_1 = __importDefault(require("@models/supportModel"));
const http_errors_1 = __importDefault(require("http-errors"));
const userModel_1 = __importDefault(require("@models/userModel"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const http_status_codes_1 = require("http-status-codes");
const create = async (req, res, next) => {
    const { userId, description } = req.body;
    let error, user, support;
    [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findById(userId));
    if (error)
        return next(error);
    if (!user)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found"));
    console.log(user);
    [error, support] = await (0, await_to_ts_1.default)(supportModel_1.default.create({ user: userId, userName: user.name, userAvatar: user.avatar || "", description, date: Date.now() }));
    if (error)
        return next(error);
    return res.status(http_status_codes_1.StatusCodes.CREATED).json({ success: true, message: "Success", data: support });
};
const get = async (req, res, next) => {
    const { id } = req.params;
    const [error, support] = await (0, await_to_ts_1.default)(supportModel_1.default.findById(id).lean());
    if (error)
        return next(error);
    if (!support)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Support not found"));
    return res.status(http_status_codes_1.StatusCodes.ACCEPTED).json({ success: true, message: "Success", data: support });
};
const getAll = async (req, res, next) => {
    const { name } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    if (page < 1 || limit < 1) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Page and limit must be positive integers"
        });
    }
    const query = name ? { userName: new RegExp(name, "i") } : {};
    const [error, supports] = await (0, await_to_ts_1.default)(supportModel_1.default.find(query).lean().skip(skip).limit(limit));
    if (error)
        return next(error);
    const total = await supportModel_1.default.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Success",
        data: {
            supports: supports || [],
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        }
    });
};
const SupportControllers = {
    create,
    get,
    getAll
};
exports.default = SupportControllers;
