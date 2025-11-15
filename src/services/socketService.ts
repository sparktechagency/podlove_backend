import { Socket, Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { NextFunction } from 'express';
import ChatService from './chatService';
import { verifyJwtAndFetchUser } from '@middlewares/authorization';
import { asyncHandler } from '@shared/asyncHandler';
import { decodeToken } from "@utils/jwt";
import { StatusCodes } from "http-status-codes";

interface AuthenticatedSocket extends Socket {
  user?: any;
}

const userSockets = new Map<string, string[]>();

export default function initSocketHandlers(io: any): void {

  // Authentication middleware for socket connections
  io.use(async (socket: any, next: (err?: any) => void) => {
    try {
      const rawToken = (socket.handshake as any).auth?.token || socket.handshake.headers.authorization || "";
      if (!rawToken) {
        return next(new Error("Authentication failed"));
      }
      const user = await verifyJwtAndFetchUser(
        rawToken,
        process.env.JWT_ACCESS_SECRET!,
      );
      (socket as AuthenticatedSocket).data = { user };

      next();
    } catch (err) {
      next(err);
    }

  });


  io.on('connection', (socket: AuthenticatedSocket) => {
    // const userId = 
    // console.log(`User ${socket.data.user?.name} connected with socket ID: ${socket.id}`);
    // console.log("user: ", socket.data.user.userId)
    // Store user socket mapping
    addUserSocket(socket.data.user!.userId, socket.id);

    // Handle joining chat rooms
    socket.on('join-chat', async ({ chatId }) => {
      try {
        // Verify user is participant in this chat
        // console.log("is participatns: ", socket.data.user!.userId);
        const chats = await ChatService.getUserChats(socket.data.user!.userId);
        // console.log("chats: ", chats, " chatId: ", chatId);
        const isParticipant = chats.some(chat => chat._id.toHexString() === chatId);
        // const isParticipant = chats.some(chat =>chat._id.equals(chatId));
        // console.log("is participatns: ", isParticipant);
        if (!isParticipant) {
          socket.emit('error', { message: 'You are not a participant in this chat' });
          return;
        }
        // const chatId = socket.id;
        socket.join(socket.id);
        socket.emit('joined-chat', { chatId });

        // Notify other participants that user joined
        socket.to(chatId).emit('user-joined', {
          userId: socket.data.user!._id,
          username: socket.data.user!.name
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle leaving chat rooms
    socket.on('leave-chat', (chatId: string) => {
      socket.leave(chatId);
      socket.to(chatId).emit('user-left', {
        userId: socket.user!.id,
        username: socket.user!.username
      });
    });

    // Handle sending messages
    socket.on('send-message', async (data: {
      chatId: string;
      content: string;
      messageType?: 'text' | 'image' | 'file';
      replyTo?: string;
    }) => {
      try {
        // console.log("data: ", data, " userId: ", socket.data);
        const message = await ChatService.sendMessage(
          data.chatId,
          socket.data.user!.userId,
          data.content,
          data.messageType || 'text',
          data.replyTo
        );
        // console.log("message: ", data.chatId);

        // Emit to all participants in the chat
        io.to(data.chatId).emit('new-message', {
          chatId: data.chatId,
          message
        });

        // Send push notification to offline users
        await sendPushNotifications(data.chatId, socket.data.user!.userId, message);

      } catch (error) {
        socket.emit('error', {
          message: error ? error : 'Failed to send message'
        });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data: { chatId: string }) => {
      // console.log("typing start: ", data.chatId)
      socket.to(data.chatId).emit('user-typing', {
        userId: socket.data.user!.userId,
        username: socket.data.user!.name
      });
    });

    socket.on('typing-stop', (data: { chatId: string }) => {
      socket.to(data.chatId).emit('user-stopped-typing', {
        userId: socket.data.user!.userId,
        username: socket.data.user!.name
      });
    });

    // Handle message editing
    socket.on('edit-message', async (data: {
      chatId: string;
      messageId: string;
      content: string;
    }) => {
      try {
        const message = await ChatService.editMessage(
          data.chatId,
          data.messageId,
          socket.data.user!.userId,
          data.content
        );

        io.to(data.chatId).emit('message-edited', {
          chatId: data.chatId,
          messageId: data.messageId,
          message
        });

      } catch (error) {
        socket.emit('error', {
          message: error instanceof Error ? error.message : 'Failed to edit message'
        });
      }
    });

    // Handle message deletion
    socket.on('delete-message', async (data: {
      chatId: string;
      messageId: string;
    }) => {
      try {
        await ChatService.deleteMessage(
          data.chatId,
          data.messageId,
          socket.data.user!.userId
        );

        io.to(data.chatId).emit('message-deleted', {
          chatId: data.chatId,
          messageId: data.messageId
        });

      } catch (error) {
        socket.emit('error', {
          message: error instanceof Error ? error.message : 'Failed to delete message'
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // console.log(`User ${socket.data.user?.name} disconnected`);
      removeUserSocket(socket.data.user!.userId, socket.id);
    });
  });


  io.on('connection', (socket: AuthenticatedSocket) => {
    // console.log(`User ${socket.user?.username} connected with socket ID: ${socket.id}`);

    // Store user socket mapping
    addUserSocket(socket.user!.id, socket.id);

    // Handle joining chat rooms
    socket.on('join-chat', async (chatId: string) => {
      try {
        // Verify user is participant in this chat
        const chats = await ChatService.getUserChats(socket.user!.id);
        const isParticipant = chats.some(chat => chat._id.toString() === chatId);

        if (!isParticipant) {
          socket.emit('error', { message: 'You are not a participant in this chat' });
          return;
        }

        socket.join(chatId);
        socket.emit('joined-chat', { chatId });

        // Notify other participants that user joined
        socket.to(chatId).emit('user-joined', {
          userId: socket.user!.id,
          username: socket.user!.username
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle leaving chat rooms
    socket.on('leave-chat', (chatId: string) => {
      socket.leave(chatId);
      socket.to(chatId).emit('user-left', {
        userId: socket.user!.id,
        username: socket.user!.username
      });
    });

    // Handle sending messages
    socket.on('send-message', async (data: {
      chatId: string;
      content: string;
      messageType?: 'text' | 'image' | 'file';
      replyTo?: string;
    }) => {
      try {
        const message = await ChatService.sendMessage(
          data.chatId,
          socket.user!.id,
          data.content,
          data.messageType || 'text',
          data.replyTo
        );

        // Emit to all participants in the chat
        io.to(data.chatId).emit('new-message', {
          chatId: data.chatId,
          message
        });

        // Send push notification to offline users
        await sendPushNotifications(data.chatId, socket.user!.id, message);

      } catch (error) {
        socket.emit('error', {
          message: error ? error : 'Failed to send message'
        });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data: { chatId: string }) => {
      socket.to(data.chatId).emit('user-typing', {
        userId: socket.user!.id,
        username: socket.user!.username
      });
    });

    socket.on('typing-stop', (data: { chatId: string }) => {
      socket.to(data.chatId).emit('user-stopped-typing', {
        userId: socket.user!.id,
        username: socket.user!.username
      });
    });

    // Handle message editing
    socket.on('edit-message', async (data: {
      chatId: string;
      messageId: string;
      content: string;
    }) => {
      try {
        const message = await ChatService.editMessage(
          data.chatId,
          data.messageId,
          socket.user!.id,
          data.content
        );

        io.to(data.chatId).emit('message-edited', {
          chatId: data.chatId,
          messageId: data.messageId,
          message
        });

      } catch (error) {
        socket.emit('error', {
          message: error instanceof Error ? error.message : 'Failed to edit message'
        });
      }
    });

    // Handle message deletion
    socket.on('delete-message', async (data: {
      chatId: string;
      messageId: string;
    }) => {
      try {
        await ChatService.deleteMessage(
          data.chatId,
          data.messageId,
          socket.user!.id
        );

        io.to(data.chatId).emit('message-deleted', {
          chatId: data.chatId,
          messageId: data.messageId
        });

      } catch (error) {
        socket.emit('error', {
          message: error instanceof Error ? error.message : 'Failed to delete message'
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // console.log(`User ${socket.user?.username} disconnected`);
      removeUserSocket(socket.user!.id, socket.id);
    });
  });
}

// Helper methods for user socket management
function addUserSocket(userId: string, socketId: string): void {
  // Grab existing array (or start a new one)
  const sockets = userSockets.get(userId) || [];
  sockets.push(socketId);
  // Store it back on the map
  userSockets.set(userId, sockets);
}

function removeUserSocket(userId: string, socketId: string): void {
  const sockets = userSockets.get(userId);
  if (!sockets) return;

  // Filter out the one that disconnected
  const filtered = sockets.filter((id) => id !== socketId);

  if (filtered.length > 0) {
    // Still have some left → update
    userSockets.set(userId, filtered);
  } else {
    // No sockets left → entirely remove the user
    userSockets.delete(userId);
  }
}

// Check if user is online
function isUserOnline(userId: string): boolean {
  return userSockets.has(userId);
}

// Send push notifications to offline users
async function sendPushNotifications(chatId: string, senderId: string, message: any) {
  try {
    const chats = await ChatService.getUserChats(senderId);
    const chat = chats.find((c: { _id: { toString: () => string; }; }) => c._id.toString() === chatId);
    if (!chat) return;

    // Find offline participants
    const offlineParticipants = chat.participants.filter((participant: { _id: { toString: () => any; }; }) => {
      const participantId = participant._id?.toString();
      return participantId !== senderId && !isUserOnline(participantId!);
    });

    // Here you would implement your push notification logic
    // For example, using Firebase Cloud Messaging (FCM)
    for (const participant of offlineParticipants) {
      // Assuming participant is an object with a username property
      // console.log(`Sending push notification to ${(participant as any).name}`);
      // await this.sendPushNotification(participant._id, message);
    }
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
}


const socketService = {
  initSocketHandlers
}
export { socketService };
function createError(UNAUTHORIZED: any, arg1: string): any {
  throw new Error('Function not implemented.');
}

