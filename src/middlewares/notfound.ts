import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";

export const notFound = (req: Request, res: Response, next: NextFunction): any => {
  return res.status(httpStatus.NOT_FOUND).json({ error: "API Not Found !!" });
};