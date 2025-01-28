"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userModel_1 = __importDefault(require("../models/userModel"));
const http_errors_1 = __importDefault(require("http-errors"));
const http_status_codes_1 = require("http-status-codes");
const await_to_ts_1 = __importDefault(require("await-to-ts"));
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
        avatar: user.avatar
    };
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "User data retrieved successfully.", data: data });
};
const update = async (req, res, next) => {
    const userId = req.params.id;
    const updates = req.body;
    const [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findByIdAndUpdate(userId, { $set: updates }, { new: true }));
    if (error)
        return next(error);
    if (!user)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found."));
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: user });
};
// const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
//   const { name, contact, address, avatarUrl } = req.body;
//   const userId = req.user.userId;
//   const email = req.user.email;
//   let error, user;
//
//   if (!name && !contact && !address && !avatarUrl) {
//     return next(createError(StatusCodes.BAD_REQUEST, "At least one field should be updated."));
//   }
//
//   [error, user] = await to(User.findById(userId));
//   if (error) return next(error);
//   if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found."));
//
//   user.name = name || user.name;
//   user.phoneNumber = contact || user.phoneNumber;
//   user.address = address || user.address;
//   user.avatar = avatarUrl || user.avatar;
//
//   [error] = await to(user.save());
//   if (error) return next(error);
//
//   const data = {
//     name: user.name,
//     email: email,
//     contact: user.phoneNumber,
//     address: user.address,
//     avatar: user.avatar,
//   };
//
//   return res.status(StatusCodes.OK).json({ success: true, message: "User updated successfully.", data: data });
// };
const UserController = {
    get,
    update
};
exports.default = UserController;
