import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import Auth from "@models/authModel";
import User from "@models/userModel";
import { Method } from "@shared/enums";
import sendEmail from "@utils/sendEmail";
import sendSMS from "@utils/sendSMS";

const register = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { name, email, phoneNumber, password, confirmPassword } = req.body;

  let auth = await Auth.findByEmail(email);
  if (auth) {
    const message = auth.isVerified
      ? "Email already exists! Please login."
      : "Email already exists! Please verify your account";
    auth.generateVerificationOTP();
    await auth.save();
    return res
      .status(StatusCodes.CONFLICT)
      .json({ success: false, message: message, data: { isVerified: auth.isVerified, otp: auth.verificationOTP } });
  }

  const session = req.session;
  auth = new Auth({
    email,
    password,
  });
  auth.generateVerificationOTP();
  await auth.save({ session });

  const user = new User({
    auth: auth._id,
    name,
    phoneNumber,
  });
  await user.save({ session });
  await sendEmail(email, auth.verificationOTP);

  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Please check your email for otp.",
    data: { isVerified: auth.isVerified, otp: auth.verificationOTP },
  });
};

const activate = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, otp } = req.body;
  const auth = await Auth.findByEmailWithOutPassword(email);
  if (!auth) throw createError(StatusCodes.NOT_FOUND, "User not found");

  if (!auth.isCorrectVerificationOTP(otp))
    throw createError(StatusCodes.UNAUTHORIZED, "Wrong OTP. Please enter the correct code");

  if (auth.isVerificationOTPExpired()) throw createError(StatusCodes.UNAUTHORIZED, "Verification OTP has expired.");

  auth.clearVerificationOTP();
  auth.isVerified = true;
  await auth.save();
  const accessToken = Auth.generateAccessToken(auth._id!.toString());
  const user = await User.findOne({ auth: auth._id }).populate({ path: "auth", select: "email" });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Account successfully verified.",
    data: { accessToken, auth, user },
  });
};

const login = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, password } = req.body;
  let auth = await Auth.findByEmail(email);
  if(auth?.isBlocked) return next(createError(StatusCodes.FORBIDDEN, "Your account has been blocked by an administrator. Please reach out to the admin for help."))
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "No account found with the given email"));

  if (!(await auth.comparePassword(password)))
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong password. Please try again"));

  if (!auth.isVerified) return next(createError(StatusCodes.UNAUTHORIZED, "Verify your email first"));
  const accessToken = Auth.generateAccessToken(auth._id!.toString());
  const user = await User.findOne({ auth: auth._id }).populate({ path: "auth", select: "email" });

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    data: { accessToken, auth, user },
  });
};

const signInWithGoogle = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { googleId, name, email, avatar } = req.body;
  let auth, user;
  auth = await Auth.findOne({ googleId: googleId });
  if (!auth) {
    auth = await Auth.create({ googleId, email });
    user = await User.create({ auth: auth._id, name, avatar });
  }
  const accessToken = Auth.generateAccessToken(auth._id!.toString());
  user = await User.findOne({ auth: auth._id }).populate({ path: "auth", select: "email" });
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    data: { accessToken, auth, user },
  });
};

const recovery = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email } = req.body;

  let auth = await Auth.findByEmail(email);
  if (!auth) return next(createError(StatusCodes.NOT_FOUND, "No account found with the given email"));
  auth.generateRecoveryOTP();
  await auth.save();
  await sendEmail(email, auth.recoveryOTP);
  return res
    .status(StatusCodes.OK)
    .json({ success: true, message: "Success", data: { recoveryOTP: auth.recoveryOTP } });
};

const recoveryVerification = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, otp } = req.body;
  let auth = await Auth.findByEmailWithOutPassword(email);
  if (!auth) throw createError(StatusCodes.NOT_FOUND, "User not found");

  if (auth.isRecoveryOTPExpired()) return next(createError(StatusCodes.UNAUTHORIZED, "Recovery OTP has expired."));
  if (!auth.isCorrectRecoveryOTP(otp))
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong OTP. Please try again"));
  auth.clearRecoveryOTP();

  await auth.save();
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Email successfully verified.",
    data: {},
  });
};

const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, password, confirmPassword } = req.body;

  let auth = await Auth.findByEmail(email);
  if (!auth) throw createError(StatusCodes.NOT_FOUND, "User Not Found");
  if (password !== confirmPassword) return next(createError(StatusCodes.BAD_REQUEST, "Passwords don't match"));

  auth.password = password;
  await auth.save();
  return res.status(StatusCodes.OK).json({ success: true, message: "Password reset successful", data: {} });
};

type resendOTPPayload = {
  method: Method;
  email: string;
};

const resendOTP = async (req: Request<{}, {}, resendOTPPayload>, res: Response, next: NextFunction): Promise<any> => {
  const { method, email } = req.body;
  // console.log("resend otp: ", req.body);
   
   const auth = await Auth.findByEmail(email);
  // console.log("auth: ", auth);
  if (!auth) throw createError(StatusCodes.NOT_FOUND, "Account not found");
 
  if ((method === Method.emailActivation || method === Method.phoneActivation) && auth.isVerified)
    return res.status(StatusCodes.CONFLICT).json({
      success: true,
      message: "Your account is already verified. Please login.",
      data: { isVerified: auth.isVerified },
    });
  if (method === Method.emailActivation && !auth.isVerified) {
    auth.generateVerificationOTP();
    await auth.save();
    await sendEmail(email, auth.verificationOTP);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "OTP resend successful",
      data: { isVerified: auth.isVerified, verificationOTP: auth.verificationOTP },
    });
  } else if (method === Method.phoneActivation && !auth.isVerified) {
    auth.generateVerificationOTP();
    await auth.save();

    let user = await User.findOne({ auth: auth._id });
    await sendSMS(user!.phoneNumber, auth.verificationOTP);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "OTP resend successful",
      data: { isVerified: auth.isVerified, verificationOTP: auth.verificationOTP },
    });
  } else if (method === Method.emailRecovery) {
    auth.generateRecoveryOTP();
    await auth.save();
    await sendEmail(email, auth.recoveryOTP);

    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "OTP resend successful", data: { recoveryOTP: auth.recoveryOTP } });
  }
};

const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const user = req.user;
  const { password, newPassword, confirmPassword } = req.body;

  let auth = await Auth.findByEmail(user.email);
  if (!auth) throw createError(StatusCodes.NOT_FOUND, "User Not Found");
  if (!(await auth.comparePassword(password)))
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong Password. Please try again."));

  auth.password = newPassword;
  await auth.save();
  return res.status(StatusCodes.OK).json({ success: true, message: "Password changed successfully", data: {} });
};

const remove = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const userId = req.user.userId;
  const authId = req.user.authId;
  await Promise.all([Auth.findByIdAndDelete(authId), User.findByIdAndDelete(userId)]);
  return res.status(StatusCodes.OK).json({ success: true, message: "User Removed successfully", data: {} });
};

const AuthController = {
  register,
  activate,
  login,
  signInWithGoogle,
  recovery,
  recoveryVerification,
  resendOTP,
  resetPassword,
  changePassword,
  remove,
};

export default AuthController;
