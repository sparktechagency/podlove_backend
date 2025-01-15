import to from "await-to-ts";
import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import createError from "http-errors";

import Auth from "@models/authModel";
import User from "@models/userModel";

import { Role } from "@shared/enum";
import { decodeToken } from "@utils/jwt";
import { DecodedUser } from "@schemas/decodedUser";
import { StatusCodes } from "http-status-codes";

export const getUserInfo = async (authId: string): Promise<DecodedUser | null> => {
  let error, auth, user, data: DecodedUser;
  [error, auth] = await to(Auth.findById(authId).select("email role isVerified isBlocked"));
  if (error || !auth) return null;
  [error, user] = await to(User.findOne({ auth: authId }));
  if (error || !user) return null;
  data = {
    authId: auth._id!.toString(),
    email: auth.email,
    role: auth.role,
    isVerified: auth.isVerified,
    isBlocked: auth.isBlocked,
    userId: user._id!.toString(),
    name: user.name,
  };
  return data;
};

const authorizeToken = (secret: string, errorMessage: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return next(createError(StatusCodes.UNAUTHORIZED, "Not Authorized"));
    }

    const token = authHeader.split(" ")[1];
    if (!secret) {
      return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, "JWT secret is not defined."));
    }

    const [error, decoded] = decodeToken(token, secret);
    if (error) return next(error);
    if (!decoded) return next(createError(StatusCodes.UNAUTHORIZED, errorMessage));

    const data = await getUserInfo(decoded.id);
    if (!data) return next(createError(StatusCodes.NOT_FOUND, "Account Not Found"));

    if (data.isBlocked) return next(createError(StatusCodes.FORBIDDEN, "You are blocked"));
    req.user = data;

    return next();
  };
};

const hasAccess = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    console.log(user);
    if (roles.includes(user.role as Role)) return next();
    return next(createError(403, "Access Denied."));
  };
};

export const authorize = authorizeToken(process.env.JWT_ACCESS_SECRET!, "Invalid Access Token");
export const refreshAuthorize = authorizeToken(process.env.JWT_REFRESH_SECRET!, "Invalid Refresh Token");
export const recoveryAuthorize = authorizeToken(process.env.JWT_RECOVERY_SECRET!, "Invalid Recovery Token");
export const isAdmin = hasAccess([Role.ADMIN]);

// export const isGUEST = hasAccess([Role.GUEST]);
// export const isHOSTOrDJ = hasAccess([Role.HOST, Role.DJ]);
