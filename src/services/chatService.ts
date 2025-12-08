import { Types } from "mongoose";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Chat, IChat, IMessage } from "@models/chatModel";

async function createChat(
  participants: string[],
  chatType: "private" | "group",
  createdBy: string,
  chatName?: string
): Promise<IChat> {
  if (chatType === "private" && participants.length !== 2) {
    throw createError(StatusCodes.BAD_REQUEST, "Participants length should be two");
  }
  if (chatType === "private") {
    const existingChat = await Chat.findOne({
      chatType: "private",
      participants: { $all: participants, $size: 2 },
    })
      .lean()
      .exec();

    if (existingChat) {
      // existingChat is a plain object (lean), cast to IChat
      return existingChat as unknown as IChat;
    }
  }

  const chat = new Chat({
    participants: participants.map((id) => new Types.ObjectId(id)),
    chatType,
    chatName,
    createdBy: new Types.ObjectId(createdBy),
  });

  const saved = await chat.save();
  // saved is a Mongoose Document; convert to plain object to match IChat
  return (saved.toObject ? saved.toObject() : saved) as unknown as IChat;
}

async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  messageType: "text" | "image" | "file" = "text",
  replyTo?: string
): Promise<IMessage> {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw createError(StatusCodes.BAD_REQUEST, "Chat ID not found");
  }

  const isParticipant = chat.participants.some((participant) => participant.toString() === senderId);

  if (!isParticipant) {
    throw createError(StatusCodes.BAD_REQUEST, "Participants not found");
  }

  const message: IMessage = {
    content,
    sender: new Types.ObjectId(senderId),
    timestamp: new Date(),
    messageType,
    replyTo: replyTo ? new Types.ObjectId(replyTo) : undefined,
  };

  chat.messages.push(message);
  chat.lastMessage = message;

  await chat.save();

  const populatedChat = await Chat.findById(chatId).populate("messages.sender", "name email").exec();

  const lastMsg = populatedChat!.messages[populatedChat!.messages.length - 1];
  return lastMsg as unknown as IMessage;
}

async function editMessage(chatId: string, messageId: string, senderId: string, newContent: string): Promise<IMessage> {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw createError(StatusCodes.BAD_REQUEST, "Chat ID not found");
  }

  const message = chat.messages.find((msg: IMessage & { _id?: any }) => msg._id?.toString() === messageId);

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

  return message as unknown as IMessage;
}

async function getChatHistory(
  chatId: string,
  userId: string,
  page: number = 1,
  limit: number = 50
): Promise<{ messages: IMessage[]; totalPages: number; currentPage: number }> {
  const chat = await Chat.findById(chatId).populate("messages.sender", "username email avatar").exec();

  if (!chat) {
    throw createError(StatusCodes.BAD_REQUEST, "Chat ID not found");
  }

  const isParticipant = chat.participants.some((participant) => participant.toString() === userId);

  if (!isParticipant) {
    throw createError(StatusCodes.BAD_REQUEST, "Participants not found");
  }

  const totalMessages = chat.messages.length;
  const totalPages = Math.ceil(totalMessages / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const messages = chat.messages
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(startIndex, endIndex);

  return {
    messages: messages as IMessage[],
    totalPages,
    currentPage: page,
  };
}

async function getUserChats(userId: string): Promise<IChat[]> {
  // Validate userId as ObjectId (this will throw if invalid)
  const objectId = Types.ObjectId.createFromHexString(userId);

  const chats = await Chat.find({
    participants: objectId,
    isActive: true,
  })
    .populate({
      path: "participants",
      select: "name email avatar",
    })
    .populate({
      path: "lastMessage.sender",
      select: "name email",
    })
    .sort({ updatedAt: -1 })
    .lean()
    .exec();

  // chats returned by .lean() are plain objects; assert to IChat[]
  return chats as unknown as IChat[];
}

async function deleteMessage(chatId: string, messageId: string, userId: string): Promise<void> {
  const chat = await Chat.findById(chatId);

  if (!chat) {
    throw createError(StatusCodes.BAD_REQUEST, "Chat ID not found");
  }

  const message = chat.messages.find((msg: IMessage & { _id?: any }) => msg._id?.toString() === messageId);

  if (!message) {
    throw createError(StatusCodes.BAD_REQUEST, "Message not found");
  }

  if (message.sender.toString() !== userId) {
    throw createError(StatusCodes.BAD_REQUEST, "you can only delete your own message");
  }

  chat.messages = chat.messages.filter((msg: IMessage & { _id?: any }) => msg._id?.toString() !== messageId);
  await chat.save();
}

const ChatService = {
  deleteMessage,
  getChatHistory,
  createChat,
  sendMessage,
  editMessage,
  getUserChats,
};
export default ChatService;
