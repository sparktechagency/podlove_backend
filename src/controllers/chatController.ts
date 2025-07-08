import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chatService';
import { StatusCodes } from "http-status-codes";
import createError from "http-errors";

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  // Create a new chat
  createChat = async (req: Request, res: Response) => {
    const { participants, chatType, chatName } = req.body;
    const createdBy = req.user?.userId; // Use _id if that's the correct property, or update to match your DecodedUser type

    if (!createdBy) {
      throw createError(StatusCodes.BAD_REQUEST, "User not authenticated");
    }

    // Add creator to participants if not already included
    if (!participants.includes(createdBy)) {
      participants.push(createdBy);
    }

    const chat = await this.chatService.createChat(
      participants, 
      chatType, 
      createdBy, 
      chatName
    );

    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      data: chat
    });
  };

  // Get user's chats
  getUserChats = async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw createError(StatusCodes.BAD_REQUEST, "User not authenticated");
    }

    const chats = await this.chatService.getUserChats(userId);

    res.status(200).json({
      success: true,
      data: chats
    });
  };

  // Get chat history
  getChatHistory = async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user?.userId;

    if (!userId) {
      throw createError(StatusCodes.BAD_REQUEST, "User not authenticated");
    }

    const result = await this.chatService.getChatHistory(
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

  // Edit message
  editMessage = async (req: Request, res: Response) => {
    const { chatId, messageId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw createError(StatusCodes.BAD_REQUEST, "User not authenticated");
    }

    const message = await this.chatService.editMessage(
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

  // Delete message
  deleteMessage = async (req: Request, res: Response) => {
    const { chatId, messageId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw createError(StatusCodes.BAD_REQUEST, "User not authenticated");
    }

    await this.chatService.deleteMessage(chatId, messageId, userId);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  };
}