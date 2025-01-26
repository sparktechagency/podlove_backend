import to from "await-to-ts";
import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import createError from "http-errors";

import Auth from "@models/authModel";
import User from "@models/userModel";

import { Role } from "@shared/enums";
import { decodeToken } from "@utils/jwt";
import { DecodedAdmin, DecodedUser } from "@schemas/decodedUser";
import { StatusCodes } from "http-status-codes";
import Administrator from "@models/administratorModel";

export const getAdminInfo = async (id: string): Promise<DecodedAdmin | null> => {
  let error, admin, data: DecodedAdmin;

  [error, admin] = await to(Administrator.findById(id));
  if (error || !admin) return null;

  data = {
    id: admin._id!.toString(),
    isAdmin: true
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


    const data = await getAdminInfo(decoded.id);
    if (!data) return next(createError(StatusCodes.NOT_FOUND, "Account Not Found"));

    if (!data.isAdmin) return next(createError(StatusCodes.FORBIDDEN, "Forbidden"));

    req.admin = data;
    return next();
  };
};

export const isAdmin = authorizeToken(process.env.JWT_ADMIN_SECRET!, "Invalid Access Token");
export const recoveryAuthorize = authorizeToken(process.env.JWT_RECOVERY_SECRET!, "Invalid Recovery Token");

