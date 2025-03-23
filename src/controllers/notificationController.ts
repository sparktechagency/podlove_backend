import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

const get = async (req: Request, res: Response, next: NextFunction) : Promise<any> => {
    return res.status(StatusCodes.OK).json({success: true, message: "Success", data : {notifications: []}});
}

const NotificationController = {
    get,
}

export default NotificationController;