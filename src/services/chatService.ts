import { Types } from 'mongoose';
// import { Chat, IChat, IMessage } from '@/models/Chat';
import createError from "http-errors";
// import { Chat, IChat, IMessage } from '@models/chatModel';
import { StatusCodes } from 'http-status-codes';
import { Chat, IChat, IMessage } from '@models/chatModel';

 async function createChat(
    participants: string[], 
    chatType: 'private' | 'group', 
    createdBy: string, 
    chatName?: string
  ): Promise<IChat> {
    // For private chats, ensure only 2 participants
    if (chatType === 'private' && participants.length !== 2) {
      throw createError(StatusCodes.BAD_REQUEST, "Participants length should be two");
    }

    // Check if private chat already exists
    if (chatType === 'private') {
      const existingChat = await Chat.findOne({
        chatType: 'private',
        participants: { $all: participants, $size: 2 }
      });
      
      if (existingChat) {
        return existingChat;
      }
    }

    const chat = new Chat({
      participants: participants.map(id => new Types.ObjectId(id)),
      chatType,
      chatName,
      createdBy: new Types.ObjectId(createdBy)
    });

    return await chat.save();
  }

  async function sendMessage(
    chatId: string, 
    senderId: string, 
    content: string, 
    messageType: 'text' | 'image' | 'file' = 'text',
    replyTo?: string
  ): Promise<IMessage> {
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      throw createError(StatusCodes.BAD_REQUEST, "Chat ID not found");
    }

    // Verify sender is a participant
    const isParticipant = chat.participants.some(
      participant => participant.toString() === senderId
    );
    
    if (!isParticipant) {
      throw createError(StatusCodes.BAD_REQUEST, "Participants not found");
    }

    const message: IMessage = {
      content,
      sender: new Types.ObjectId(senderId),
      timestamp: new Date(),
      messageType,
      replyTo: replyTo ? new Types.ObjectId(replyTo) : undefined
    };

    // Add message to chat and update lastMessage
    chat.messages.push(message);
    chat.lastMessage = message;
    
    await chat.save();
    
    // Return the message with populated sender info
    const populatedChat = await Chat.findById(chatId)
      .populate('messages.sender', 'username email')
      .exec();
    
    return populatedChat!.messages[populatedChat!.messages.length - 1];
  }


async function editMessage(
    chatId: string, 
    messageId: string, 
    senderId: string, 
    newContent: string
  ): Promise<IMessage> {
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      throw createError(StatusCodes.BAD_REQUEST, "Chat ID not found");
    }

    const message = chat.messages.find(
      (msg: IMessage & { _id?: any }) => msg._id?.toString() === messageId
    );
    
    if (!message) {
      throw createError(StatusCodes.BAD_REQUEST, "Message not found");
    }

    if (message.sender.toString() !== senderId) {
      throw createError(StatusCodes.BAD_REQUEST, "Invalid sender ID");
    }

    message.content = newContent;
    message.edited = true;
    message.editedAt = new Date();
    
    await chat.save();
    
    return message;
  }

  async function getChatHistory(
    chatId: string, 
    userId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<{messages: IMessage[], totalPages: number, currentPage: number}> {
    const chat = await Chat.findById(chatId)
      .populate('messages.sender', 'username email avatar')
      .exec();
    
    if (!chat) {
      throw createError(StatusCodes.BAD_REQUEST, "Chat ID not found");
    }

    // Verify user is a participant
    const isParticipant = chat.participants.some(
      participant => participant.toString() === userId
    );
    
    if (!isParticipant) {
      throw createError(StatusCodes.BAD_REQUEST, "Participants not found");
    }

    const totalMessages = chat.messages.length;
    const totalPages = Math.ceil(totalMessages / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Get messages in reverse order (newest first), then slice for pagination
    const messages = chat.messages
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(startIndex, endIndex);

    return {
      messages,
      totalPages,
      currentPage: page
    };
  }

// Get user's chats
  async function getUserChats(userId: string): Promise<IChat[]> {
    return await Chat.find({
      participants: userId,
      isActive: true
    })
    .populate('participants', 'username email avatar')
    .populate('lastMessage.sender', 'username email')
    .sort({ updatedAt: -1 })
    .exec();
  }

// Delete a message
  async function deleteMessage(chatId: string, messageId: string, userId: string): Promise<void> {
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
       throw createError(StatusCodes.BAD_REQUEST, "Chat ID not found");
    }

    const message = chat.messages.find(
      (msg: IMessage & { _id?: any }) => msg._id?.toString() === messageId
    );
    
    if (!message) {
      throw createError(StatusCodes.BAD_REQUEST, "Message not found");
    }

    if (message.sender.toString() !== userId) {
      throw createError(StatusCodes.BAD_REQUEST, "you can only delete your own message");
    }

    chat.messages = chat.messages.filter(
      (msg: IMessage & { _id?: any }) => msg._id?.toString() !== messageId
    );
    await chat.save();
  }
 



const ChatService = {
deleteMessage,
getChatHistory,
createChat,
sendMessage,
editMessage,
getUserChats
}
export default ChatService;