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
const jwt_1 = require("@utils/jwt");
const authModel_1 = __importDefault(require("@models/authModel"));
const userModel_1 = __importDefault(require("@models/userModel"));
const enums_1 = require("@shared/enums");
const generateOTP_1 = __importDefault(require("@utils/generateOTP"));
const sendEmail_1 = __importDefault(require("@utils/sendEmail"));
const sendSMS_1 = __importDefault(require("@utils/sendSMS"));
const register = async (req, res, next) => {
    const { name, email, phoneNumber, password, confirmPassword } = req.body;
    let error, auth, user;
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const verificationOTP = (0, generateOTP_1.default)();
    const verificationOTPExpiredAt = new Date(Date.now() + 30 * 60 * 1000);
    [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.findOne({ email }));
    if (error)
        return next(error);
    if (auth && !auth.isVerified) {
        auth.verificationOTP = verificationOTP;
        auth.verificationOTPExpiredAt = verificationOTPExpiredAt;
        [error] = await (0, await_to_ts_1.default)(auth.save());
        if (error)
            return next(error);
        await (0, sendEmail_1.default)(email, verificationOTP);
        return res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
            success: false,
            message: "Your account already exists. Please verify now.",
            data: { isVerified: auth.isVerified, verificationOTP: auth.verificationOTP },
        });
    }
    if (auth && auth.isVerified) {
        return res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
            success: false,
            message: "Your account already exists. Please login now.",
            data: { isVerified: auth.isVerified },
        });
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
const activate = async (req, res, next) => {
    const { email, verificationOTP } = req.body;
    let auth, user, error;
    if (!email || !verificationOTP) {
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email and Verification OTP are required."));
    }
    [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.findOne({ email }).select("-password"));
    if (error)
        return next(error);
    if (!auth)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found"));
    const currentTime = new Date();
    if (!auth.verificationOTP || !auth.verificationOTPExpiredAt || currentTime > auth.verificationOTPExpiredAt) {
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
    [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findOne({ auth: auth._id }).populate({ path: "auth", select: "email" }));
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
    let error, auth, user, isPasswordValid;
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
    [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findOne({ auth: auth._id }).populate({ path: "auth", select: "email" }));
    if (error)
        return next(error);
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Login successful",
        data: { accessToken, refreshToken, auth, user },
    });
};
const signInWithGoogle = async (req, res, next) => {
    const { googleId, name, email, avatar } = req.body;
    let error, auth, user;
    [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.findOne({ googleId: googleId }));
    if (error)
        return next(error);
    if (!auth) {
        [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.create({ googleId, email }));
        if (error)
            return next(error);
        [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.create({ auth: auth._id, name, avatar }));
        if (error)
            return next(error);
    }
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!accessSecret || !refreshSecret)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "JWT secret is not defined."));
    const accessToken = (0, jwt_1.generateToken)(auth._id.toString(), accessSecret, "96h");
    const refreshToken = (0, jwt_1.generateToken)(auth._id.toString(), refreshSecret, "96h");
    [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findOne({ auth: auth._id }).populate({ path: "auth", select: "email" }));
    if (error)
        return next(error);
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Login successful",
        data: { accessToken, refreshToken, auth, user },
    });
};
const recovery = async (req, res, next) => {
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
const recoveryVerify = async (req, res, next) => {
    const { email, recoveryOTP } = req.body;
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
    let error, auth, user;
    [error, auth] = await (0, await_to_ts_1.default)(authModel_1.default.findOne({ email: email }));
    if (error)
        return next(error);
    if (!auth)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Account not found"));
    let verificationOTP, recoveryOTP;
    if ((method === enums_1.Method.emailActivation || method === enums_1.Method.phoneActivation) && auth.isVerified)
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Your account is already verified. Please login.",
            data: { isVerified: auth.isVerified },
        });
    if (method === enums_1.Method.emailActivation && !auth.isVerified) {
        verificationOTP = (0, generateOTP_1.default)();
        auth.verificationOTP = verificationOTP;
        auth.verificationOTPExpiredAt = new Date(Date.now() + 60 * 1000);
        [error] = await (0, await_to_ts_1.default)(auth.save());
        if (error)
            return next(error);
        await (0, sendEmail_1.default)(email, verificationOTP);
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "OTP resend successful",
            data: { isVerified: auth.isVerified, verificationOTP: auth.verificationOTP },
        });
    }
    else if (method === enums_1.Method.phoneActivation && !auth.isVerified) {
        verificationOTP = (0, generateOTP_1.default)();
        auth.verificationOTP = verificationOTP;
        auth.verificationOTPExpiredAt = new Date(Date.now() + 60 * 1000);
        [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findOne({ auth: auth._id }));
        if (error)
            return next(error);
        [error] = await (0, await_to_ts_1.default)(auth.save());
        if (error)
            return next(error);
        await (0, sendSMS_1.default)(user.phoneNumber, verificationOTP);
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "OTP resend successful",
            data: { isVerified: auth.isVerified, verificationOTP: auth.verificationOTP },
        });
    }
    else if (method === enums_1.Method.emailRecovery) {
        recoveryOTP = (0, generateOTP_1.default)();
        auth.recoveryOTP = recoveryOTP;
        auth.recoveryOTPExpiredAt = new Date(Date.now() + 60 * 1000);
        [error] = await (0, await_to_ts_1.default)(auth.save());
        if (error)
            return next(error);
        await (0, sendEmail_1.default)(email, recoveryOTP);
        return res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ success: true, message: "OTP resend successful", data: { recoveryOTP: auth.recoveryOTP } });
    }
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
    activate,
    login,
    signInWithGoogle,
    recovery,
    recoveryVerify,
    resendOTP,
    resetPassword,
    changePassword,
    remove,
};
exports.default = AuthController;
