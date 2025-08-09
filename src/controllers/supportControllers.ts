import { Request, Response, NextFunction } from "express";
import Support from "@models/supportModel";
import createError from "http-errors";
import User from "@models/userModel";
import to from "await-to-ts";
import { StatusCodes } from "http-status-codes";

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { category, description } = req.body;
  const userId = req.user.userId;
  let error, user, support;
  [error, user] = await to(User.findById(userId));
  if (error) return next(error);
  if (!user) return next(createError(StatusCodes.NOT_FOUND, "User not found"));
  // console.log(user);
  [error, support] = await to(
    Support.create({ user: userId, userName: user.name, userAvatar: user.avatar || "", category: category, description, date: Date.now() })
  );
  if (error) return next(error);

  return res.status(StatusCodes.CREATED).json({ success: true, message: "Success", data: support });
};

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  const [error, support] = await to(Support.findById(id).lean());
  if (error) return next(error);
  if (!support) return next(createError(StatusCodes.NOT_FOUND, "Support not found"));
  return res.status(StatusCodes.ACCEPTED).json({ success: true, message: "Success", data: support });
};

const getAll = async (req: Request, res: Response, next: NextFunction): Promise<any> => {

  const { name } = req.query;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  if (page < 1 || limit < 1) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Page and limit must be positive integers"
    });
  }

  const query = name ? { userName: new RegExp(name as string, "i") } : {};

  const [error, supports] = await to(Support.find(query).lean().skip(skip).limit(limit));
  if (error) return next(error);

  const total = await Support.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Success",
    data: {
      supports: supports || [],
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }
  });
};


const SupportControllers = {
  create,
  get,
  getAll
};


export default SupportControllers;
