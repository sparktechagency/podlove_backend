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
const enums_1 = require("../shared/enums");
const getAllUsers = async (req, res, next) => {
    const { search } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    if (page < 1 || limit < 1) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Page and limit must be positive integers"
        });
    }
    try {
        let users;
        let totalUsers;
        if (search) {
            const aggregation = [
                {
                    $lookup: {
                        from: "auths",
                        localField: "auth",
                        foreignField: "_id",
                        as: "authDetails"
                    }
                },
                {
                    $unwind: {
                        path: "$authDetails",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $match: {
                        $or: [
                            { "authDetails.email": { $regex: search, $options: "i" } },
                            { name: { $regex: search, $options: "i" } },
                            { phoneNumber: { $regex: search, $options: "i" } },
                            { gender: search },
                            { address: { $regex: search, $options: "i" } }
                        ]
                    }
                },
                {
                    $project: {
                        name: 1,
                        phoneNumber: 1,
                        gender: 1,
                        age: 1,
                        address: 1,
                        "authDetails.email": 1,
                        "authDetails.isBlocked": 1
                    }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                }
            ];
            users = await userModel_1.default.aggregate(aggregation);
            const countAggregation = [
                {
                    $lookup: {
                        from: "auths",
                        localField: "auth",
                        foreignField: "_id",
                        as: "authDetails"
                    }
                },
                {
                    $unwind: {
                        path: "$authDetails",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $match: {
                        $or: [
                            { "authDetails.email": { $regex: search, $options: "i" } },
                            { name: { $regex: search, $options: "i" } },
                            { phoneNumber: { $regex: search, $options: "i" } },
                            { gender: search },
                            { address: { $regex: search, $options: "i" } }
                        ]
                    }
                },
                {
                    $count: "total"
                }
            ];
            const totalResult = await userModel_1.default.aggregate(countAggregation);
            totalUsers = totalResult[0]?.total || 0;
        }
        else {
            const [error, fetchedUsers] = await (0, await_to_ts_1.default)(userModel_1.default.find()
                .populate({ path: "auth", select: "email isBlocked" })
                .select("name avatar phoneNumber gender age address survey")
                .lean()
                .skip(skip)
                .limit(limit));
            if (error)
                return next(error);
            users = fetchedUsers || [];
            totalUsers = await userModel_1.default.countDocuments();
        }
        const totalPages = Math.ceil(totalUsers / limit);
        if (!users || users.length === 0) {
            return res.status(http_status_codes_1.StatusCodes.OK).json({
                success: true,
                message: "No users found",
                data: {
                    users: [],
                    pagination: search ? undefined : {
                        page,
                        limit,
                        totalPages: 0,
                        totalUsers: 0
                    }
                }
            });
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Successfully retrieved users information",
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    totalPages,
                    totalUsers
                }
            }
        });
    }
    catch (error) {
        return next(error);
    }
};
const getAllPremiumUsers = async (req, res, next) => {
    const { search } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    if (page < 1 || limit < 1) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Page and limit must be positive integers"
        });
    }
    try {
        let users;
        let totalUsers;
        if (search) {
            users = await userModel_1.default.find({
                "subscription.status": enums_1.SubscriptionStatus.PAID,
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { "subscription.plan": { $regex: search, $options: "i" } }
                ]
            })
                .select("name subscription")
                .lean()
                .skip(skip)
                .limit(limit);
            totalUsers = await userModel_1.default.countDocuments({
                "subscription.status": enums_1.SubscriptionStatus.PAID,
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { "subscription.plan": { $regex: search, $options: "i" } }
                ]
            });
        }
        else {
            const [error, fetchedUsers] = await (0, await_to_ts_1.default)(userModel_1.default.find({ "subscription.status": enums_1.SubscriptionStatus.PAID })
                .select("name subscription avatar")
                .lean()
                .skip(skip)
                .limit(limit));
            if (error)
                return next(error);
            users = fetchedUsers || [];
            totalUsers = await userModel_1.default.countDocuments({ "subscription.status": enums_1.SubscriptionStatus.PAID });
        }
        const totalPages = Math.ceil(totalUsers / limit);
        if (!users || users.length === 0) {
            return res.status(http_status_codes_1.StatusCodes.OK).json({
                success: true,
                message: "No premium users found",
                data: {
                    users: [],
                    pagination: {
                        page,
                        limit,
                        totalPages: 0,
                        totalUsers: 0
                    }
                }
            });
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Successfully retrieved premium users information",
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    totalPages,
                    totalUsers
                }
            }
        });
    }
    catch (error) {
        return next(error);
    }
};
const block = async (req, res, next) => {
    const authId = req.params.authId;
    const [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.findById(authId));
    if (error)
        return next(error);
    if (!auth)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found"));
    if (auth.isBlocked) {
        auth.isBlocked = false;
    }
    else if (!auth.isBlocked) {
        auth.isBlocked = true;
    }
    await auth.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: auth.isBlocked ? "User blocked successfully" : "User unblocked successfully",
        data: { isBlocked: auth.isBlocked }
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
        data: { isBlocked: auth.isBlocked }
    });
};
const UserServices = {
    getAllUsers,
    getAllPremiumUsers,
    block,
    unblock
};
exports.default = UserServices;
