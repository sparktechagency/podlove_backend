"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userModel_1 = __importDefault(require("../models/userModel"));
const http_errors_1 = __importDefault(require("http-errors"));
const http_status_codes_1 = require("http-status-codes");
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const cloudinary_1 = __importDefault(require("../shared/cloudinary"));
const get = async (req, res, next) => {
    const userId = req.user.userId;
    const email = req.user.email;
    let error, user;
    [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findById(userId));
    if (error)
        return next(error);
    if (!user)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found."));
    const data = {
        name: user.name,
        email: email,
        contact: user.phoneNumber,
        address: user.address,
        avatar: user.avatar,
    };
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "User data retrieved successfully.", data: data });
};
const update = async (req, res, next) => {
    const { name, contact, address, avatarUrl } = req.body;
    const userId = req.user.userId;
    const email = req.user.email;
    let error, user;
    if (!name && !contact && !address && !avatarUrl) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.BAD_REQUEST, "At least one field should be updated."));
    }
    [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findById(userId));
    if (error)
        return next(error);
    if (!user)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found."));
    user.name = name || user.name;
    user.phoneNumber = contact || user.phoneNumber;
    user.address = address || user.address;
    if (avatarUrl && user.avatar !== null && user.avatar !== undefined && user.avatar !== "") {
        await cloudinary_1.default.remove(user.avatar);
        user.avatar = avatarUrl;
    }
    [error] = await (0, await_to_ts_1.default)(user.save());
    if (error)
        return next(error);
    const data = {
        name: user.name,
        email: email,
        contact: user.phoneNumber,
        address: user.address,
        avatar: user.avatar,
    };
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "User updated successfully.", data: data });
};
const UserController = {
    get,
    update,
};
exports.default = UserController;
