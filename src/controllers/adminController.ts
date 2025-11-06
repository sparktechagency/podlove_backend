import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import Administrator from "@models/adminModel";
import { AdminAccess } from "@shared/enums";
import to from "await-to-ts";
import { StatusCodes } from "http-status-codes";
import createError from "http-errors";
import sendEmail from "@utils/sendEmail";
import Admin from "@models/adminModel";
import Auth from "@models/authModel";

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { name, email, contact, password } = req.body;
  const access: AdminAccess = req.body.access;

  // const hashedPassword = await bcrypt.hash(password, 10);

  const [error, admin] = await to(Administrator.create({ name, email, contact, password: password, access }));
  if (error) return next(error);

  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Administrator created successfully.",
    data: { admin }
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
  const avatar = req.file;
  const avatarUrl = `uploads/images/${avatar?.filename}`;
  const { name, contact, address } = req.body;
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
  let admin = await Admin.findByEmail(email);
  if (!admin) return next(createError(StatusCodes.NOT_FOUND, "No account found with the given email"));
  if (!(await admin.comparePassword(password)))
    return next(createError(StatusCodes.UNAUTHORIZED, "Wrong password. Please try again"));

  const accessToken = Admin.generateAccessToken(admin._id!.toString());
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    data: { accessToken }
  });
};

const recovery = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email } = req.body;
  const admin = await Auth.findOne({ email });
  if (!admin) throw createError(StatusCodes.NOT_FOUND, "No account found with the given email");
  admin.generateRecoveryOTP();
  await sendEmail(email, admin.recoveryOTP);
  await admin.save();
  return res
    .status(StatusCodes.OK)
    .json({ success: true, message: "Success", data: { recoveryOTP: admin.recoveryOTP } });
};

const recoveryVerification = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, recoveryOTP } = req.body;
  const admin = await Admin.findByEmailWithoutPassword(email);
  if (!admin) throw createError(StatusCodes.NOT_FOUND, "Admin not found");
  if (admin.isRecoveryOTPExpired()) throw createError(StatusCodes.UNAUTHORIZED, "Recovery OTP has expired.");
  if (!admin.isCorrectRecoveryOTP(recoveryOTP))
    throw createError(StatusCodes.UNAUTHORIZED, "Wrong OTP. Please try again");
  admin.clearRecoveryOTP();
  await admin.save();
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Email successfully verified."
  });
};

const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { email, password, confirmPassword } = req.body;
  let admin = await Admin.findByEmail(email);
  if (!admin) throw createError(StatusCodes.NOT_FOUND, "User Not Found");
  if (password !== confirmPassword) throw createError(StatusCodes.BAD_REQUEST, "Passwords don't match");
  admin.password = password;
  await admin.save();
  return res.status(StatusCodes.OK).json({ success: true, message: "Password reset successful", data: {} });
};

const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // const email = req.user?.email;
    const { password, newPassword, confirmPassword, email } = req.body;

    console.log("req.admin: ", password, newPassword, confirmPassword);

    if (!email) {
      throw createError(StatusCodes.UNAUTHORIZED, "Unauthorized access");
    }

    if (!password || !newPassword || !confirmPassword) {
      throw createError(StatusCodes.BAD_REQUEST, "All fields are required");
    }

    if (newPassword !== confirmPassword) {
      throw createError(
        StatusCodes.BAD_REQUEST,
        "New password and confirm password do not match"
      );
    }

    const admin = await Admin.findByEmail(email);
    if (!admin) {
      throw createError(StatusCodes.NOT_FOUND, "Admin not found");
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      throw createError(StatusCodes.UNAUTHORIZED, "Wrong password. Please try again.");
    }

    admin.password = newPassword;
    await admin.save();

    console.log("Password changed successfully", isMatch);

    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};

const AdminController = {
  create,
  getAll,
  getAdminInfo,
  update,
  updateAdmin,
  remove,
  login,
  recovery,
  recoveryVerification,
  changePassword,
  resetPassword
};

export default AdminController;