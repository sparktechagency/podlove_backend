import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import createError from "http-errors";

export type Decoded = {
  id: string;
};

export const generateToken = (id: string, secret: string, duration: string): string =>
  jwt.sign({ id }, secret, { expiresIn: duration });

export const decodeToken = (token: string, secret: string): [Error | null, Decoded | null] => {
  let decoded: Decoded | null = null;
  try {
    decoded = jwt.verify(token, secret) as jwt.JwtPayload & Decoded;
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return [createError(401, "Token has expired"), null];
    }
    if (err instanceof JsonWebTokenError) {
      return [createError(401, "Invalid or malformed token"), null];
    }
    return [createError(500, "Internal Server Error"), null];
  }

  return [null, decoded];
};