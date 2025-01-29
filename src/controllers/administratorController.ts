import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Administrator from "@models/administratorModel";
import { AdminAccess } from "@shared/enums";
import to from "await-to-ts";
import { StatusCodes } from "http-status-codes";
import createError from "http-errors";
import { generateAdminToken, generateToken } from "@utils/jwt";
import Auth from "@models/authModel";
import generateOTP from "@utils/generateOTP";
import sendEmail from "@utils/sendEmail";


const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { name, email, contact, password } = req.body;
  const access: AdminAccess = req.body.access;

  const hashedPassword = await bcrypt.hash(password, 10);

  const [error, admin] = await to(Administrator.create({ name, email, contact, password: hashedPassword, access }));
  if (error) return next(error);

  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Administrator created successfully.",
    data: {}
  });
};

const getAll = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;
  const { search } = req.query;

  try {
    let query = {};
    if (search) {
      const regex = new RegExp(search as string, "i");
      query = {
        $or: [
          { name: regex },
          { email: regex },
          { contact: regex }
        ]
      };
    }


    const [error, admins] = await to(
      Administrator.find(query).select("-password").skip(skip).limit(limit).lean()
    );
    if (error) return next(error);


    const totalAdmins = await Administrator.countDocuments(query);
    const totalPages = Math.ceil(totalAdmins / limit);

    return res.status(StatusCodes.OK).json({
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
  } catch (error) {
    return next(error);
  }
};

const updateAdmin = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const adminId = req.params.id;
  const { name, email, contact, password, address } = req.body;
  const access: AdminAccess = req.body.access;
  let error, admin;
  [error, admin] = await to(Administrator.findById(adminId));
  if (error) return next(error);
  if (!admin) return next(createError(StatusCodes.NOT_FOUND, "Administrator not found."));

  admin.email = email || admin.email;
  admin.name = name || admin.name;
  admin.contact = contact || admin.contact;
  admin.address = address || admin.address;
  if (password) {
    admin.password = await bcrypt.hash(password, 10);
  }
  admin.access = access || admin.access;

  [error] = await to(admin.save());
  if (error) return next(error);

  const data = {
    name: admin.name,
    email: admin.email,
    contact: admin.contact,
    address: admin.address,
    access: admin.access
  };

  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: data });
};

const getAdminInfo = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const id = req.admin.id;
  const [error, admin] = await to(Administrator.findById(id).select("-password"));
  if (error) return next(error);
  if (!admin) return next(createError(StatusCodes.NOT_FOUND, "Administrator not found."));

  return res.status(StatusCodes.OK).json({ success: true, message: "Administrator info successfully.", data: admin });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const adminId = req.admin.id;
  const { name, contact, address, avatarUrl } = req.body;
  let error, admin;
  [error, admin] = await to(Administrator.findById(adminId));
  if (error) return next(error);
  if (!admin) return next(createError(StatusCodes.NOT_FOUND, "Administrator not found."));

  admin.name = name || admin.name;
  admin.contact = contact || admin.contact;
  admin.address = address || admin.address;
  admin.avatar = avatarUrl || admin.avatar;

  [error] = await to(admin.save());
  if (error) return next(error);

  const data = {
    name: admin.name,
    email: admin.email,
    contact: admin.contact,
    address: admin.address,
    avatar: admin.avatar
  };

  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: data });
};

const remove = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const adminId = req.params.id;
  const [error, admin] = await to(Administrator.findByIdAndDelete(adminId));
  if (error) return next(error);
  if (!admin) return next(createError(StatusCodes.NOT_FOUND, "Administrator not found."));
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Administrator removed successfully.",
    data: {}
  });
};

const login = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, password } = req.body;
  let error, admin, isPasswordValid;

  [error, admin] = await to(Administrator.findOne({ email }));
  if (error) return next(error);
  if (!admin) return next(createError(StatusCodes.NOT_FOUND, "No Admin account found with the given email"));

  [error, isPasswordValid] = await to(bcrypt.compare(password, admin.password));
  if (error) return next(error);

  if (!isPasswordValid) return next(createError(StatusCodes.UNAUTHORIZED, "Wrong password"));

  const adminSecret = process.env.JWT_ADMIN_SECRET;
  if (!adminSecret)
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "JWT secret is not defined."));

  const accessToken = generateAdminToken(admin._id!.toString(), true, adminSecret, "96h");

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    data: { accessToken }
  });
};

const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const adminId = req.admin.id;

  const { password, newPassword, confirmPassword } = req.body;
  let error, admin, isMatch;

  [error, admin] = await to(Administrator.findById(adminId));
  if (error) return next(error);
  if (!admin) return next(createError(StatusCodes.NOT_FOUND, "Admin Not Found"));

  [error, isMatch] = await to(bcrypt.compare(password, admin.password));
  if (error) return next(error);
  if (!isMatch) return next(createError(StatusCodes.UNAUTHORIZED, "Wrong Password"));

  admin.password = await bcrypt.hash(newPassword, 10);
  await admin.save();
  return res.status(StatusCodes.OK).json({ success: true, message: "Passowrd changed successfully", data: {} });
};

const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email } = req.body;

  const [error, admin] = await to(Administrator.findOne({ email }));
  if (error) return next(error);
  if (!admin) return next(createError(StatusCodes.NOT_FOUND, "User Not Found"));

  const recoveryOTP = generateOTP();
  admin.recoveryOTP = recoveryOTP;
  admin.recoveryOTPExpiredAt = new Date(Date.now() + 60 * 1000);
  await admin.save();

  await sendEmail(email, recoveryOTP);

  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: recoveryOTP });
};

const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, recoveryOTP } = req.body;
  let error, admin;

  if (!email || !recoveryOTP) {
    return next(createError(StatusCodes.BAD_REQUEST, "Email and Recovery OTP are required."));
  }

  [error, admin] = await to(Administrator.findOne({ email }).select("-password"));
  if (error) return next(error);
  if (!admin) return next(createError(StatusCodes.NOT_FOUND, "User not found"));

  if (!admin.recoveryOTP || !admin.recoveryOTPExpiredAt) {
    return next(createError(StatusCodes.UNAUTHORIZED, "Recovery OTP is not set or has expired."));
  }

  const currentTime = new Date();
  if (currentTime > admin.recoveryOTPExpiredAt) {
    return next(createError(StatusCodes.UNAUTHORIZED, "Recovery OTP has expired."));
  }

  if (recoveryOTP !== admin.recoveryOTP) {
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong OTP."));
  }

  admin.recoveryOTP = "";
  admin.recoveryOTPExpiredAt = null;

  [error] = await to(admin.save());
  if (error) return next(error);

  const adminSecret = process.env.JWT_ADMIN_SECRET;
  if (!adminSecret)
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "JWT secret is not defined."));

  const recoveryToken = generateAdminToken(admin._id!.toString(), true, adminSecret, "96h");

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Email successfully verified.",
    data: recoveryToken
  });
};

const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {

  const { email, password, confirmPassword } = req.body;

  const [error, admin] = await to(Administrator.findOne({ email }));
  if (error) return next(error);
  if (!admin) return next(createError(StatusCodes.NOT_FOUND, "Admin Not Found"));

  if (password !== confirmPassword) return next(createError(StatusCodes.BAD_REQUEST, "Passwords don't match"));
  admin.password = await bcrypt.hash(password, 10);
  await admin.save();

  return res.status(StatusCodes.OK).json({ success: true, message: "Password reset successful", data: {} });
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

export default AdministratorController;