"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_errors_1 = __importDefault(require("http-errors"));
const http_status_codes_1 = require("http-status-codes");
const jwt_1 = require("../utils/jwt");
const authModel_1 = __importDefault(require("../models/authModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
const generateOTP_1 = __importDefault(require("../utils/generateOTP"));
const register = async (req, res, next) => {
    const { name, email, phoneNumber, password, confirmPassword } = req.body;
    let error, auth, user;
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const verificationOTP = (0, generateOTP_1.default)();
    const verificationOTPExpiredAt = new Date(Date.now() + 30 * 60 * 1000);
    [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.findOne({ email }));
    if (error)
        return next(error);
    if (auth) {
        return res
            .status(http_status_codes_1.StatusCodes.CONFLICT)
            .json({ success: false, message: "Email already exists.", data: { isVerified: auth.isVerified } });
    }
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.create([
            {
                email,
                password: hashedPassword,
                verificationOTP,
                verificationOTPExpiredAt,
                isVerified: false,
                isBlocked: false,
            },
        ], { session }));
        if (error)
            throw error;
        auth = auth[0];
        [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.create([
            {
                auth: auth._id,
                name,
                phoneNumber,
            },
        ], { session }));
        if (error)
            throw error;
        await session.commitTransaction();
        await (0, sendEmail_1.default)(email, verificationOTP);
        return res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            message: "Registration successful",
            data: { isVerified: auth.isVerified, verificationOTP: auth.verificationOTP },
        });
    }
    catch (error) {
        await session.abortTransaction();
        return next(error);
    }
    finally {
        await session.endSession();
    }
};
const activation = async (req, res, next) => {
    const { method, email, verificationOTP } = req.body;
    let auth, user, error;
    if (!email || !verificationOTP) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email and Verification OTP are required."));
    }
    [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.findOne({ email }).select("-password"));
    if (error)
        return next(error);
    if (!auth)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found"));
    if (!auth.verificationOTP || !auth.verificationOTPExpiredAt) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Verification OTP is not set or has expired."));
    }
    const currentTime = new Date();
    if (currentTime > auth.verificationOTPExpiredAt) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Verification OTP has expired."));
    }
    if (verificationOTP !== auth.verificationOTP) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Wrong OTP. Please enter the correct one"));
    }
    auth.verificationOTP = "";
    auth.verificationOTPExpiredAt = null;
    auth.isVerified = true;
    [error] = await (0, await_to_ts_1.default)(auth.save());
    if (error)
        return next(error);
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if (!accessSecret) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "JWT secret is not defined."));
    }
    const accessToken = (0, jwt_1.generateToken)(auth._id.toString(), accessSecret, "96h");
    [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findOne({ auth: auth._id }));
    if (error)
        return next(error);
    if (!user) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Associated user not found."));
    }
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Account successfully verified.",
        data: { accessToken, auth, user },
    });
};
const login = async (req, res, next) => {
    const { email, password } = req.body;
    let error, auth, isPasswordValid;
    [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.findOne({ email }));
    if (error)
        return next(error);
    if (!auth)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "No account found with the given email"));
    [error, isPasswordValid] = await (0, await_to_ts_1.default)(bcrypt_1.default.compare(password, auth.password));
    if (error)
        return next(error);
    if (!isPasswordValid)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Wrong password"));
    if (!auth.isVerified)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Verify your email first"));
    if (auth.isBlocked)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.FORBIDDEN, "Your account had been blocked. Contact Administrator"));
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!accessSecret || !refreshSecret)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "JWT secret is not defined."));
    const accessToken = (0, jwt_1.generateToken)(auth._id.toString(), accessSecret, "96h");
    const refreshToken = (0, jwt_1.generateToken)(auth._id.toString(), refreshSecret, "96h");
    const user = await userModel_1.default.findOne({ auth: auth._id });
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Login successful",
        data: { accessToken, refreshToken, auth, user },
    });
};
const signInWithGoogle = async (req, res, next) => {
    const { googleId, name, email } = req.body;
    let error, auth, user;
    [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.find({ googleId: googleId }));
    if (error)
        return next(error);
    if (!auth) {
        [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.create({ googleId, email }));
        if (error)
            return next(error);
        [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.create({ auth: auth._id, name }));
    }
};
const forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    const [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.findOne({ email }));
    if (error)
        return next(error);
    if (!auth)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found"));
    const recoveryOTP = (0, generateOTP_1.default)();
    auth.recoveryOTP = recoveryOTP;
    auth.recoveryOTPExpiredAt = new Date(Date.now() + 60 * 1000);
    await auth.save();
    await (0, sendEmail_1.default)(email, recoveryOTP);
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: {} });
};
const recovery = async (req, res, next) => {
    const { method, email, recoveryOTP } = req.body;
    let error, auth;
    if (!email || !recoveryOTP) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email and Recovery OTP are required."));
    }
    [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.findOne({ email }).select("-password"));
    if (error)
        return next(error);
    if (!auth)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found"));
    if (!auth.recoveryOTP || !auth.recoveryOTPExpiredAt) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Recovery OTP is not set or has expired."));
    }
    const currentTime = new Date();
    if (currentTime > auth.recoveryOTPExpiredAt) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Recovery OTP has expired."));
    }
    if (recoveryOTP !== auth.recoveryOTP) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Wrong OTP."));
    }
    auth.recoveryOTP = "";
    auth.recoveryOTPExpiredAt = null;
    [error] = await (0, await_to_ts_1.default)(auth.save());
    if (error)
        return next(error);
    const recoverySecret = process.env.JWT_RECOVERY_SECRET;
    if (!recoverySecret) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "JWT secret is not defined."));
    }
    const recoveryToken = (0, jwt_1.generateToken)(auth._id.toString(), recoverySecret, "96h");
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Email successfully verified.",
        data: recoveryToken,
    });
};
const resetPassword = async (req, res, next) => {
    const user = req.user;
    const { password, confirmPassword } = req.body;
    const [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.findOne({ email: user.email }));
    if (error)
        return next(error);
    if (!auth)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found"));
    if (password !== confirmPassword)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.BAD_REQUEST, "Passwords don't match"));
    auth.password = await bcrypt_1.default.hash(password, 10);
    await auth.save();
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Password reset successful", data: {} });
};
const resendOTP = async (req, res, next) => {
    const { method, email } = req.body;
    let error, auth;
    [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.findOne({ email: email }));
    if (error)
        return next(error);
    if (!auth)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Account not found"));
    let verificationOTP, recoveryOTP;
    if (status === "activate" && auth.isVerified)
        return res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ success: true, message: "Your account is already verified. Please login.", data: {} });
    if (status === "activate" && !auth.isVerified) {
        verificationOTP = (0, generateOTP_1.default)();
        auth.verificationOTP = verificationOTP;
        auth.verificationOTPExpiredAt = new Date(Date.now() + 60 * 1000);
        [error] = await (0, await_to_ts_1.default)(auth.save());
        if (error)
            return next(error);
        (0, sendEmail_1.default)(email, verificationOTP);
    }
    if (status === "recovery") {
        recoveryOTP = (0, generateOTP_1.default)();
        auth.recoveryOTP = recoveryOTP;
        auth.recoveryOTPExpiredAt = new Date(Date.now() + 60 * 1000);
        [error] = await (0, await_to_ts_1.default)(auth.save());
        if (error)
            return next(error);
        (0, sendEmail_1.default)(email, recoveryOTP);
    }
    return res
        .status(http_status_codes_1.StatusCodes.OK)
        .json({ success: true, message: "OTP resend successful", data: { verificationOTP, recoveryOTP } });
};
const changePassword = async (req, res, next) => {
    const user = req.user;
    const { password, newPassword, confirmPassword } = req.body;
    let error, auth, isMatch;
    [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.findById(user.authId));
    if (error)
        return next(error);
    if (!auth)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User Not Found"));
    [error, isMatch] = await (0, await_to_ts_1.default)(bcrypt_1.default.compare(password, auth.password));
    if (error)
        return next(error);
    if (!isMatch)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Wrong Password"));
    auth.password = await bcrypt_1.default.hash(newPassword, 10);
    await auth.save();
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Passowrd changed successfully", data: {} });
};
const remove = async (req, res, next) => {
    const userId = req.user.userId;
    const authId = req.user.authId;
    try {
        await Promise.all([authModel_1.default.findByIdAndDelete(authId), userModel_1.default.findByIdAndDelete(userId)]);
        return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "User Removed successfully", data: {} });
    }
    catch (e) {
        return next(e);
    }
};
const AuthController = {
    register,
    activation,
    login,
    forgotPassword,
    recovery,
    resendOTP,
    resetPassword,
    changePassword,
    remove,
};
exports.default = AuthController;
