"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userModel_1 = __importDefault(require("../models/userModel"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const match = async (userId) => {
    let error, user, matchedUsers;
    [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findById(userId));
    if (error)
        throw error;
    [error, matchedUsers] = await (0, await_to_ts_1.default)(userModel_1.default.aggregate([
        { $match: { _id: { $ne: userId } } },
        { $project: { _id: 1 } },
        { $sample: { size: 3 } }
    ]));
    if (error)
        throw error;
    let matches = [];
    matches.push(matchedUsers[0]._id);
    matches.push(matchedUsers[1]._id);
    matches.push(matchedUsers[2]._id);
    return matches;
};
const matchedUsers = async (req, res, next) => {
    // const userId = req.params.id;
    // const [error, user] = await to(User.findById(userId)
    //   .populate({ path: "first", select: "bio interests" })
    //   .populate({ path: "second", select: "bio interests" })
    //   .populate({ path: "third", select: "bio interests" })
    //   .lean());
    // if (error) return next(error);
    // if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found"));
    // return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: user.matches });
};
const MatchedServices = {
    match,
    matchedUsers
};
exports.default = MatchedServices;
