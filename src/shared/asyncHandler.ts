import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn: AsyncRequestHandler) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const asyncSessionHandler = (fn: AsyncRequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      req.session = session;
      await fn(req, res, next);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      next(error);
    } finally {
      await session.endSession();
    }
  };
};

