"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userModel_1 = __importDefault(require("@models/userModel"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const enums_1 = require("@shared/enums");
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
const findMatchingUsers = async (currentUser) => {
    const query = {};
    query["gender"] = { $in: currentUser.preferences.gender };
    query["age"] = { $gte: currentUser.preferences.age.min, $lte: currentUser.preferences.age.max };
    query["bodyType"] = { $in: currentUser.preferences.bodyType };
    query["ethnicity"] = { $in: currentUser.preferences.ethnicity };
    if (currentUser.preferences.distance > 0) {
        const matchingUsers = await userModel_1.default.find(query).exec();
        const filteredUsers = matchingUsers.filter((user) => {
            const distance = calculateDistance(currentUser.location.latitude, currentUser.location.longitude, user.location.latitude, user.location.longitude);
            return distance <= currentUser.preferences.distance;
        });
        return filteredUsers;
    }
    const matchingUsers = await userModel_1.default.find(query).exec();
    return matchingUsers;
};
const currentUser = {
    preferences: {
        gender: [enums_1.Gender.FEMALE],
        age: { min: 25, max: 35 },
        bodyType: [enums_1.BodyType.SLIM, enums_1.BodyType.AVERAGE],
        ethnicity: [enums_1.Ethnicity.WHITE],
        distance: 50,
    },
    location: { latitude: 40.7128, longitude: -74.0060 },
};
findMatchingUsers(currentUser)
    .then(users => console.log("Matching users:", users))
    .catch(error => console.error("Error finding users:", error));
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
