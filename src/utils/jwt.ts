import jwt, { JsonWebTokenError, JwtPayload, TokenExpiredError } from "jsonwebtoken";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";

type Decoded = {
  id: string;
};

export const generateToken = (id: string, secret: string): string => jwt.sign({ id: id }, secret, { expiresIn: "92h" });

export const decodeToken = (token: string, secret: string): Decoded => {
  try {
    return jwt.verify(token, secret) as JwtPayload & Decoded;
  } catch (err: any) {
    let errorMessage: string;
    let statusCode: number;
    if (err instanceof TokenExpiredError) {
      errorMessage = "Token has expired";
      statusCode = StatusCodes.UNAUTHORIZED;
    } else if (err instanceof JsonWebTokenError) {
      errorMessage = "Invalid or malformed token";
      statusCode = StatusCodes.UNAUTHORIZED;
    } else {
      errorMessage = "Internal Server Error";
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    }
    throw createError(statusCode, errorMessage);
  }
};
