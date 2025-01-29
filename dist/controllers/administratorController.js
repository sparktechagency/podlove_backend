"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const administratorModel_1 = __importDefault(require("../models/administratorModel"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const http_status_codes_1 = require("http-status-codes");
const http_errors_1 = __importDefault(require("http-errors"));
const jwt_1 = require("../utils/jwt");
const generateOTP_1 = __importDefault(require("../utils/generateOTP"));
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
const create = async (req, res, next) => {
    const { name, email, contact, password } = req.body;
    const access = req.body.access;
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const [error, admin] = await (0, await_to_ts_1.default)(administratorModel_1.default.create({ name, email, contact, password: hashedPassword, access }));
    if (error)
        return next(error);
    return res.status(http_status_codes_1.StatusCodes.CREATED).json({
        success: true,
        message: "Administrator created successfully.",
        data: {}
    });
};
const getAll = async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const { search } = req.query;
    try {
        let query = {};
        if (search) {
            const regex = new RegExp(search, "i");
            query = {
                $or: [
                    { name: regex },
                    { email: regex },
                    { contact: regex }
                ]
            };
        }
        const [error, admins] = await (0, await_to_ts_1.default)(administratorModel_1.default.find(query).select("-password").skip(skip).limit(limit).lean());
        if (error)
            return next(error);
        const totalAdmins = await administratorModel_1.default.countDocuments(query);
        const totalPages = Math.ceil(totalAdmins / limit);
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Success.",
            data: {
                admins,
                pagination: {
                    page,
                    limit,
                    totalPages,
                    totalAdmins
                }
            }
        });
    }
    catch (error) {
        return next(error);
    }
};
const updateAdmin = async (req, res, next) => {
    const adminId = req.params.id;
    const { name, email, contact, password, address } = req.body;
    const access = req.body.access;
    let error, admin;
    [error, admin] = await (0, await_to_ts_1.default)(administratorModel_1.default.findById(adminId));
    if (error)
        return next(error);
    if (!admin)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Administrator not found."));
    admin.email = email || admin.email;
    admin.name = name || admin.name;
    admin.contact = contact || admin.contact;
    admin.address = address || admin.address;
    if (password) {
        admin.password = await bcrypt_1.default.hash(password, 10);
    }
    admin.access = access || admin.access;
    [error] = await (0, await_to_ts_1.default)(admin.save());
    if (error)
        return next(error);
    const data = {
        name: admin.name,
        email: admin.email,
        contact: admin.contact,
        address: admin.address,
        access: admin.access
    };
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: data });
};
const getAdminInfo = async (req, res, next) => {
    const id = req.admin.id;
    const [error, admin] = await (0, await_to_ts_1.default)(administratorModel_1.default.findById(id).select("-password"));
    if (error)
        return next(error);
    if (!admin)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Administrator not found."));
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Administrator info successfully.", data: admin });
};
const update = async (req, res, next) => {
    const adminId = req.admin.id;
    const { name, contact, address, avatarUrl } = req.body;
    let error, admin;
    [error, admin] = await (0, await_to_ts_1.default)(administratorModel_1.default.findById(adminId));
    if (error)
        return next(error);
    if (!admin)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Administrator not found."));
    admin.name = name || admin.name;
    admin.contact = contact || admin.contact;
    admin.address = address || admin.address;
    admin.avatar = avatarUrl || admin.avatar;
    [error] = await (0, await_to_ts_1.default)(admin.save());
    if (error)
        return next(error);
    const data = {
        name: admin.name,
        email: admin.email,
        contact: admin.contact,
        address: admin.address,
        avatar: admin.avatar
    };
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: data });
};
const remove = async (req, res, next) => {
    const adminId = req.params.id;
    const [error, admin] = await (0, await_to_ts_1.default)(administratorModel_1.default.findByIdAndDelete(adminId));
    if (error)
        return next(error);
    if (!admin)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Administrator not found."));
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Administrator removed successfully.",
        data: {}
    });
};
const login = async (req, res, next) => {
    const { email, password } = req.body;
    let error, admin, isPasswordValid;
    [error, admin] = await (0, await_to_ts_1.default)(administratorModel_1.default.findOne({ email }));
    if (error)
        return next(error);
    if (!admin)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "No Admin account found with the given email"));
    [error, isPasswordValid] = await (0, await_to_ts_1.default)(bcrypt_1.default.compare(password, admin.password));
    if (error)
        return next(error);
    if (!isPasswordValid)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Wrong password"));
    const adminSecret = process.env.JWT_ADMIN_SECRET;
    if (!adminSecret)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "JWT secret is not defined."));
    const accessToken = (0, jwt_1.generateAdminToken)(admin._id.toString(), true, adminSecret, "96h");
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Login successful",
        data: { accessToken }
    });
};
const changePassword = async (req, res, next) => {
    const adminId = req.admin.id;
    const { password, newPassword, confirmPassword } = req.body;
    let error, admin, isMatch;
    [error, admin] = await (0, await_to_ts_1.default)(administratorModel_1.default.findById(adminId));
    if (error)
        return next(error);
    if (!admin)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Admin Not Found"));
    [error, isMatch] = await (0, await_to_ts_1.default)(bcrypt_1.default.compare(password, admin.password));
    if (error)
        return next(error);
    if (!isMatch)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Wrong Password"));
    admin.password = await bcrypt_1.default.hash(newPassword, 10);
    await admin.save();
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Passowrd changed successfully", data: {} });
};
const forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    const [error, admin] = await (0, await_to_ts_1.default)(administratorModel_1.default.findOne({ email }));
    if (error)
        return next(error);
    if (!admin)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found"));
    const recoveryOTP = (0, generateOTP_1.default)();
    admin.recoveryOTP = recoveryOTP;
    admin.recoveryOTPExpiredAt = new Date(Date.now() + 60 * 1000);
    await admin.save();
    await (0, sendEmail_1.default)(email, recoveryOTP);
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: recoveryOTP });
};
const verifyEmail = async (req, res, next) => {
    const { email, recoveryOTP } = req.body;
    let error, admin;
    if (!email || !recoveryOTP) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email and Recovery OTP are required."));
    }
    [error, admin] = await (0, await_to_ts_1.default)(administratorModel_1.default.findOne({ email }).select("-password"));
    if (error)
        return next(error);
    if (!admin)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found"));
    if (!admin.recoveryOTP || !admin.recoveryOTPExpiredAt) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Recovery OTP is not set or has expired."));
    }
    const currentTime = new Date();
    if (currentTime > admin.recoveryOTPExpiredAt) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Recovery OTP has expired."));
    }
    if (recoveryOTP !== admin.recoveryOTP) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Wrong OTP."));
    }
    admin.recoveryOTP = "";
    admin.recoveryOTPExpiredAt = null;
    [error] = await (0, await_to_ts_1.default)(admin.save());
    if (error)
        return next(error);
    const adminSecret = process.env.JWT_ADMIN_SECRET;
    if (!adminSecret)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "JWT secret is not defined."));
    const recoveryToken = (0, jwt_1.generateAdminToken)(admin._id.toString(), true, adminSecret, "96h");
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Email successfully verified.",
        data: recoveryToken
    });
};
const resetPassword = async (req, res, next) => {
    const { email, password, confirmPassword } = req.body;
    const [error, admin] = await (0, await_to_ts_1.default)(administratorModel_1.default.findOne({ email }));
    if (error)
        return next(error);
    if (!admin)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Admin Not Found"));
    if (password !== confirmPassword)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.BAD_REQUEST, "Passwords don't match"));
    admin.password = await bcrypt_1.default.hash(password, 10);
    await admin.save();
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Password reset successful", data: {} });
};
const AdministratorController = {
    create,
    getAll,
    getAdminInfo,
    update,
    updateAdmin,
    remove,
    login,
    changePassword,
    forgotPassword,
    verifyEmail,
    resetPassword
};
exports.default = AdministratorController;
