import { Request, Response, NextFunction } from 'express';
// import { ChatService } from '@services/chatService';
import { StatusCodes } from "http-status-codes";
import createError from "http-errors";
import ChatService from '@services/chatService';
import Podcast from '@models/podcastModel';
import status from 'http-status';
import { Types } from 'mongoose';


// Create a new chat
// const createChat = async (req: Request, res: Response, next:NextFunction) => {
//     const {receiver } = req.body;
//     const createdBy = req.user?.userId; // Use _id if that's the correct property, or update to match your DecodedUser type
//     console.log("create chat: ", createdBy)
//     if (!createdBy) {
//       throw createError(StatusCodes.BAD_REQUEST, "User not authenticated");
//     }

//     const findPodcast = await Podcast.findById({primaryUser: createdBy})
//     if(!findPodcast?.selectedUser){
//        res.status(201).json({
//         status: true,
//         message: "Please communicate with admin to allow chat who are the best match fo you"
//        })
//        next();
//     }
//     const matchAllowSelected = findPodcast?.selectedUser.map(item=>item.user === receiver)
//     const chatType = "private";
//     let participants:any;
//     if(matchAllowSelected){
//       participants = [matchAllowSelected];
//     }

//     const chat = await ChatService.createChat(
//       participants, 
//       chatType, 
//       createdBy, 
//     );

//     res.status(201).json({
//       success: true,
//       message: 'Chat created successfully',
//       data: chat
//     });
//     next();
//   };

const createChat = async (req: Request, res: Response, next: NextFunction):Promise<any> => {
  try {
    const { receiver } = req.body;
    const createdBy = req.user?.userId;
    if (!createdBy) {
      throw createError(StatusCodes.BAD_REQUEST, "User not authenticated");
    }

    // ← Use findOne()
    const findPodcast = await Podcast.findOne({ primaryUser: createdBy }).lean();
    if (!findPodcast?.selectedUser?.length) {
      return res.status(StatusCodes.OK).json({
        status: false,
        message:
          "Please communicate with admin to allow chat – you have no selected users yet.",
      });
    }

    // Check whether `receiver` is among the allowed selected users
    const isAllowed = findPodcast.selectedUser.some((item: { user: Types.ObjectId }) =>
      item.user.toString() === receiver
    );
    if (!isAllowed) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ status: false, message: "Receiver not authorized for chat." });
    }

    // Build participants array
    const participants = [createdBy, receiver];
    const chatType = "private";

    const chat = await ChatService.createChat(participants, chatType, createdBy);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Chat created successfully",
      data: chat,
    });
  } catch (err) {
    next(err);
  }
};



const getUserChats = async (req: Request, res: Response,  next: NextFunction) => {
  try{
    const userId = req.user?.userId;

  if (!userId) {
    throw createError(StatusCodes.BAD_REQUEST, "User not authenticated");
  }

  const chats = await ChatService.getUserChats(userId);

  res.status(200).json({
    success: true,
    data: chats
  });
  }catch(err){
    next(err);
  }
};

const getChatHistory = async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.user?.userId;

  if (!userId) {
    throw createError(StatusCodes.BAD_REQUEST, "User not authenticated");
  }

  const result = await ChatService.getChatHistory(
    chatId,
    userId,
    parseInt(page as string),
    parseInt(limit as string)
  );

  res.status(200).json({
    success: true,
    data: result
  });
};

const editMessage = async (req: Request, res: Response) => {
  const { chatId, messageId } = req.params;
  const { content } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw createError(StatusCodes.BAD_REQUEST, "User not authenticated");
  }

  const message = await ChatService.editMessage(
    chatId,
    messageId,
    userId,
    content
  );

  res.status(200).json({
    success: true,
    message: 'Message edited successfully',
    data: message
  });
};

const deleteMessage = async (req: Request, res: Response) => {
  const { chatId, messageId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw createError(StatusCodes.BAD_REQUEST, "User not authenticated");
  }

  await ChatService.deleteMessage(chatId, messageId, userId);

  res.status(200).json({
    success: true,
    message: 'Message deleted successfully'
  });
};


const chatController = {
  createChat,
  getUserChats,
  getChatHistory,
  editMessage,
  deleteMessage
}

export default chatController;
