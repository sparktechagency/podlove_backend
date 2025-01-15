"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userModel_1 = __importDefault(require("../models/userModel"));
const http_status_codes_1 = require("http-status-codes");
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const http_errors_1 = __importDefault(require("http-errors"));
const authModel_1 = __importDefault(require("../models/authModel"));
const getAllUsers = async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    if (page < 1 || limit < 1) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Page and limit must be positive integers",
        });
    }
    const [error, [users, totalUsers]] = await (0, await_to_ts_1.default)(Promise.all([
        userModel_1.default.find()
            .populate({ path: "auth isBlocked", select: "email" })
            .select("name phoneNumber gender age address survey")
            .lean()
            .skip(skip)
            .limit(limit),
        userModel_1.default.countDocuments(),
    ]));
    if (error)
        return next(error);
    if (!users || users.length === 0) {
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "No users found",
            data: {
                users: [],
                pagination: {
                    page,
                    limit,
                    totalPages: 0,
                    totalUsers: 0,
                },
            },
        });
    }
    const totalPages = Math.ceil(totalUsers / limit);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Successfully retrieved users information",
        data: {
            users,
            pagination: {
                page,
                limit,
                totalPages,
                totalUsers,
            },
        },
    });
};
const block = async (req, res, next) => {
    const authId = req.params.authId;
    const [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.findById(authId));
    if (error)
        return next(error);
    if (!auth)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found"));
    auth.isBlocked = true;
    await auth.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "User blocked successfully",
        data: { isBlocked: auth.isBlocked },
    });
};
const unblock = async (req, res, next) => {
    const authId = req.params.authId;
    const [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.findById(authId));
    if (error)
        return next(error);
    if (!auth)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found"));
    auth.isBlocked = false;
    await auth.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "User blocked successfully",
        data: { isBlocked: auth.isBlocked },
    });
};
const UserServices = {
    getAllUsers,
    block,
    unblock,
};
exports.default = UserServices;
