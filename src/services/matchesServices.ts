import { Request, Response, NextFunction } from "express";
import User from "@models/userModel";
import to from "await-to-ts";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";

const match = async (userId: String): Promise<any> => {

  let error, user, matchedUsers;
  [error, user] = await to(User.findById(userId));
  if (error) throw error;

  [error, matchedUsers] = await to(User.aggregate([
    { $match: { _id: { $ne: userId } } },
    { $project: { _id: 1 } },
    { $sample: { size: 3 } }
  ]));
  if (error) throw error;

  let matches: string[] = [];
  matches.push(matchedUsers[0]._id as string);
  matches.push(matchedUsers[1]._id as string);
  matches.push(matchedUsers[2]._id as string);

  return matches;
};

const matchedUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
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

export default MatchedServices;