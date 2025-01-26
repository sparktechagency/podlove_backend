import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";


type payload = {
  isAll: boolean,
  userId: string,
  message: string,
  medium: ["Email", "Notifications"],
}

const sendMessage = async (req: Request<{}, {}, payload>, res: Response, next: NextFunction): Promise<any> => {
  const { isAll, userId, message, medium } = req.body;
  if (typeof isAll !== "boolean" || !message || !medium) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Bad Request", data: {} });
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Message Sent Successfully",
    data: {}
  });
};


const AdminServices = { sendMessage };

export default AdminServices;
