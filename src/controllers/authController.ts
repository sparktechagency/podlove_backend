import bcrypt from "bcrypt";
import to from "await-to-ts";
import mongoose from "mongoose";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { generateToken } from "@utils/jwt";
import { Request, Response, NextFunction } from "express";
import Auth from "@models/authModel";
import User from "@models/userModel";
import sendEmail from "@utils/sendEmail";
import generateOTP from "@utils/generateOTP";

const register = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { name, email, phoneNumber, role, password, confirmPassword } = req.body;
  let error, auth, user;

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationOTP = generateOTP();
  const verificationOTPExpiredAt = new Date(Date.now() + 60 * 1000);

  [error, auth] = await to(Auth.findOne({ email }));
  if (error) return next(error);
  if (auth) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ success: false, message: "Email already exists.", data: { isVerified: auth.isVerified } });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    [error, auth] = await to(
      Auth.create({
        email,
        password: hashedPassword,
        role,
        verificationOTP,
        verificationOTPExpiredAt,
        isVerified: false,
        isBlocked: false,
      })
    );
    if (error) throw error;

    [error, user] = await to(
      User.create({
        auth: auth._id,
        name,
        phoneNumber,
      })
    );
    if (error) throw error;
    await session.commitTransaction();
    await sendEmail(email, verificationOTP);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Registration successful",
      data: { isVerified: auth.isVerified, verificationOTP: auth.verificationOTP },
    });
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    await session.endSession();
  }
};

const activate = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, verificationOTP } = req.body;

  if (!email || !verificationOTP) {
    return next(createError(StatusCodes.BAD_REQUEST, "Email and Verification OTP are required."));
  }

  const [error, auth] = await to(Auth.findOne({ email }).select("-password"));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User not found"));

  if (!auth.verificationOTP || !auth.verificationOTPExpiredAt) {
    return next(createError(StatusCodes.UNAUTHORIZED, "Verification OTP is not set or has expired."));
  }

  const currentTime = new Date();
  if (currentTime > auth.verificationOTPExpiredAt) {
    return next(createError(StatusCodes.UNAUTHORIZED, "Verification OTP has expired."));
  }

  if (verificationOTP !== auth.verificationOTP) {
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong OTP."));
  }

  auth.verificationOTP = "";
  auth.verificationOTPExpiredAt = null;
  auth.isVerified = true;

  const [saveError] = await to(auth.save());
  if (saveError) return next(saveError);

  const accessSecret = process.env.JWT_ACCESS_SECRET;
  if (!accessSecret) {
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "JWT secret is not defined."));
  }
  const accessToken = generateToken(auth._id!.toString(), accessSecret, "96h");

  const [userError, user] = await to(User.findOne({ auth: auth._id }));
  if (userError) return next(userError);
  if (!user) {
    return next(createError(StatusCodes.NOT_FOUND, "Associated user not found."));
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Account successfully verified.",
    data: { accessToken, auth, user },
  });
};

const login = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, password } = req.body;
  let error, auth, isPasswordValid;

  [error, auth] = await to(Auth.findOne({ email }));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "No account found with the given email"));

  [error, isPasswordValid] = await to(bcrypt.compare(password, auth.password));
  if (error) return next(error);

  if (!isPasswordValid) return next(createError(StatusCodes.UNAUTHORIZED, "Wrong password"));
  if (!auth.isVerified) return next(createError(StatusCodes.UNAUTHORIZED, "Verify your email first"));
  if (auth.isBlocked)
    return next(createError(StatusCodes.FORBIDDEN, "Your account had been blocked. Contact Administrator"));

  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!accessSecret || !refreshSecret)
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "JWT secret is not defined."));

  const accessToken = generateToken(auth._id!.toString(), accessSecret, "96h");
  const refreshToken = generateToken(auth._id!.toString(), refreshSecret, "96h");

  const user = await User.findOne({ auth: auth._id });
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    data: { accessToken, refreshToken, auth, user },
  });
};

const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email } = req.body;

  const [error, auth] = await to(Auth.findOne({ email }));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User Not Found"));

  const recoveryOTP = generateOTP();
  auth.recoveryOTP = recoveryOTP;
  auth.recoveryOTPExpiredAt = new Date(Date.now() + 60 * 1000);
  await auth.save();

  await sendEmail(email, recoveryOTP);

  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: {} });
};

const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, recoveryOTP } = req.body;
  let error, auth;

  if (!email || !recoveryOTP) {
    return next(createError(StatusCodes.BAD_REQUEST, "Email and Recovery OTP are required."));
  }

  [error, auth] = await to(Auth.findOne({ email }).select("-password"));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User not found"));

  if (!auth.recoveryOTP || !auth.recoveryOTPExpiredAt) {
    return next(createError(StatusCodes.UNAUTHORIZED, "Recovery OTP is not set or has expired."));
  }

  const currentTime = new Date();
  if (currentTime > auth.recoveryOTPExpiredAt) {
    return next(createError(StatusCodes.UNAUTHORIZED, "Recovery OTP has expired."));
  }

  if (recoveryOTP !== auth.recoveryOTP) {
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong OTP."));
  }

  auth.recoveryOTP = "";
  auth.recoveryOTPExpiredAt = null;

  [error] = await to(auth.save());
  if (error) return next(error);

  const recoverySecret = process.env.JWT_RECOVERY_SECRET;
  if (!recoverySecret) {
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "JWT secret is not defined."));
  }
  const recoveryToken = generateToken(auth._id!.toString(), recoverySecret, "96h");

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Email successfully verified.",
    data: recoveryToken,
  });
};

const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const user = req.user;

  const { password, confirmPassword } = req.body;

  const [error, auth] = await to(Auth.findOne({ email: user.email }));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User Not Found"));

  if (password !== confirmPassword) return next(createError(StatusCodes.BAD_REQUEST, "Passwords don't match"));
  auth.password = await bcrypt.hash(password, 10);
  await auth.save();

  return res.status(StatusCodes.OK).json({ success: true, message: "Password reset successful", data: {} });
};

const resendOTP = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, status } = req.body;
  let error, auth;
  [error, auth] = await to(Auth.findOne({ email: email }));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "Account not found"));

  let verificationOTP, recoveryOTP;

  if (status === "activate" && auth.isVerified)
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Your account is already verified. Please login.", data: {} });

  if (status === "activate" && !auth.isVerified) {
    verificationOTP = generateOTP();
    auth.verificationOTP = verificationOTP;
    auth.verificationOTPExpiredAt = new Date(Date.now() + 60 * 1000);
    [error] = await to(auth.save());
    if (error) return next(error);
    sendEmail(email, verificationOTP);
  }

  if (status === "recovery") {
    recoveryOTP = generateOTP();
    auth.recoveryOTP = recoveryOTP;
    auth.recoveryOTPExpiredAt = new Date(Date.now() + 60 * 1000);
    [error] = await to(auth.save());
    if (error) return next(error);
    sendEmail(email, recoveryOTP);
  }

  return res
    .status(StatusCodes.OK)
    .json({ success: true, message: "OTP resend successful", data: { verificationOTP, recoveryOTP } });
};

const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const user = req.user;
  const { password, newPassword, confirmPassword } = req.body;
  let error, auth, isMatch;

  [error, auth] = await to(Auth.findById(user.authId));
  if (error) return next(error);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "User Not Found"));

  [error, isMatch] = await to(bcrypt.compare(password, auth.password));
  if (error) return next(error);
  if (!isMatch) return next(createError(StatusCodes.UNAUTHORIZED, "Wrong Password"));

  auth.password = await bcrypt.hash(newPassword, 10);
  await auth.save();
  return res.status(StatusCodes.OK).json({ success: true, message: "Passowrd changed successfully", data: {} });
};

const AuthController = {
  register,
  activate,
  login,
  forgotPassword,
  verifyEmail,
  resendOTP,
  resetPassword,
  changePassword,
};

export default AuthController;
