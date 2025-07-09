import { Socket, Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import ChatService from './chatService';
import { NextFunction } from 'express';
// import { ChatService } from './chatService';
// // import { ChatService } from './chatService';
// // import { ChatService } from './chatService';

interface AuthenticatedSocket extends Socket {
  user?: any;
}

const userSockets = new Map<string, string[]>();

export default function initSocketHandlers(io:any): void{
     // Authentication middleware for socket connections
   io.use((socket: any, next: (err?: any) => void) => {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication failed"));
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
      if (err) return next(new Error("Authentication failed"));
      // attach the decoded payload
      (socket as AuthenticatedSocket).user = decoded;
      next();
    });
  });


    io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.user?.username} connected with socket ID: ${socket.id}`);
      
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
        console.log(`User ${socket.user?.username} disconnected`);
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
      const chat = chats.find(c => c._id.toString() === chatId);
      
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
        console.log(`Sending push notification to ${(participant as any).username}`);
        // await this.sendPushNotification(participant._id, message);
      }
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  }

  // Get Socket.IO instance for external use
  // public getIO(): SocketServer {
  //   return this.io;
  // }


// interface AuthenticatedSocket extends Socket {
//   user?: {
//     id: string;
//     email: string;
//     username: string;
//   };
// }

// export class SocketService {
//   private io: SocketServer;
//   private chatService: ChatService;
//   private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds

//   constructor(server: HTTPServer) {
//     this.io = new SocketServer(server, {
//       cors: {
//         origin: process.env.CLIENT_URL || "http://localhost:3000",
//         methods: ["GET", "POST"],
//         credentials: true
//       }
//     }); 

//     this.chatService = new ChatService();
//     this.setupSocketHandlers();
//   }

//   private setupSocketHandlers() {
//     // Authentication middleware for socket connections
//     this.io.use(async (socket: AuthenticatedSocket, next) => {
//       try {
//         const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
//         if (!token) {
//           throw new Error('Authentication failed');
//         }

//         const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
//         socket.user = decoded;
        
//         next();
//       } catch (error) {
//         next(new Error('Authentication failed'));
//       }
//     });

//     this.io.on('connection', (socket: AuthenticatedSocket) => {
//       console.log(`User ${socket.user?.username} connected with socket ID: ${socket.id}`);
      
//       // Store user socket mapping
//       this.addUserSocket(socket.user!.id, socket.id);

//       // Handle joining chat rooms
//       socket.on('join-chat', async (chatId: string) => {
//         try {
//           // Verify user is participant in this chat
//           const chats = await this.chatService.getUserChats(socket.user!.id);
//           const isParticipant = chats.some(chat => chat._id.toString() === chatId);
          
//           if (!isParticipant) {
//             socket.emit('error', { message: 'You are not a participant in this chat' });
//             return;
//           }

//           socket.join(chatId);
//           socket.emit('joined-chat', { chatId });
          
//           // Notify other participants that user joined
//           socket.to(chatId).emit('user-joined', {
//             userId: socket.user!.id,
//             username: socket.user!.username
//           });
          
//         } catch (error) {
//           socket.emit('error', { message: 'Failed to join chat' });
//         }
//       });

//       // Handle leaving chat rooms
//       socket.on('leave-chat', (chatId: string) => {
//         socket.leave(chatId);
//         socket.to(chatId).emit('user-left', {
//           userId: socket.user!.id,
//           username: socket.user!.username
//         });
//       });

//       // Handle sending messages
//       socket.on('send-message', async (data: {
//         chatId: string;
//         content: string;
//         messageType?: 'text' | 'image' | 'file';
//         replyTo?: string;
//       }) => {
//         try {
//           const message = await this.chatService.sendMessage(
//             data.chatId,
//             socket.user!.id,
//             data.content,
//             data.messageType || 'text',
//             data.replyTo
//           );

//           // Emit to all participants in the chat
//           this.io.to(data.chatId).emit('new-message', {
//             chatId: data.chatId,
//             message
//           });

//           // Send push notification to offline users
//           await this.sendPushNotifications(data.chatId, socket.user!.id, message);
          
//         } catch (error) {
//           socket.emit('error', { 
//             message: error ? error : 'Failed to send message' 
//           });
//         }
//       });

//       // Handle typing indicators
//       socket.on('typing-start', (data: { chatId: string }) => {
//         socket.to(data.chatId).emit('user-typing', {
//           userId: socket.user!.id,
//           username: socket.user!.username
//         });
//       });

//       socket.on('typing-stop', (data: { chatId: string }) => {
//         socket.to(data.chatId).emit('user-stopped-typing', {
//           userId: socket.user!.id,
//           username: socket.user!.username
//         });
//       });

//       // Handle message editing
//       socket.on('edit-message', async (data: {
//         chatId: string;
//         messageId: string;
//         content: string;
//       }) => {
//         try {
//           const message = await this.chatService.editMessage(
//             data.chatId,
//             data.messageId,
//             socket.user!.id,
//             data.content
//           );

//           this.io.to(data.chatId).emit('message-edited', {
//             chatId: data.chatId,
//             messageId: data.messageId,
//             message
//           });
          
//         } catch (error) {
//           socket.emit('error', { 
//             message: error instanceof Error ? error.message : 'Failed to edit message' 
//           });
//         }
//       });

//       // Handle message deletion
//       socket.on('delete-message', async (data: {
//         chatId: string;
//         messageId: string;
//       }) => {
//         try {
//           await this.chatService.deleteMessage(
//             data.chatId,
//             data.messageId,
//             socket.user!.id
//           );

//           this.io.to(data.chatId).emit('message-deleted', {
//             chatId: data.chatId,
//             messageId: data.messageId
//           });
          
//         } catch (error) {
//           socket.emit('error', { 
//             message: error instanceof Error ? error.message : 'Failed to delete message' 
//           });
//         }
//       });

//       // Handle disconnect
//       socket.on('disconnect', () => {
//         console.log(`User ${socket.user?.username} disconnected`);
//         this.removeUserSocket(socket.user!.id, socket.id);
//       });
//     });
//   }

//   // Helper methods for user socket management
//   private addUserSocket(userId: string, socketId: string) {
//     const userSockets = this.userSockets.get(userId) || [];
//     userSockets.push(socketId);
//     this.userSockets.set(userId, userSockets);
//   }

//   private removeUserSocket(userId: string, socketId: string) {
//     const userSockets = this.userSockets.get(userId) || [];
//     const filteredSockets = userSockets.filter(id => id !== socketId);
    
//     if (filteredSockets.length === 0) {
//       this.userSockets.delete(userId);
//     } else {
//       this.userSockets.set(userId, filteredSockets);
//     }
//   }

//   // Check if user is online
//   public isUserOnline(userId: string): boolean {
//     return this.userSockets.has(userId);
//   }

//   // Send push notifications to offline users
//   private async sendPushNotifications(chatId: string, senderId: string, message: any) {
//     try {
//       const chats = await this.chatService.getUserChats(senderId);
//       const chat = chats.find(c => c._id.toString() === chatId);
      
//       if (!chat) return;

//       // Find offline participants
//       const offlineParticipants = chat.participants.filter(participant => {
//         const participantId = participant._id?.toString();
//         return participantId !== senderId && !this.isUserOnline(participantId!);
//       });

//       // Here you would implement your push notification logic
//       // For example, using Firebase Cloud Messaging (FCM)
//       for (const participant of offlineParticipants) {
//         // Assuming participant is an object with a username property
//         console.log(`Sending push notification to ${(participant as any).username}`);
//         // await this.sendPushNotification(participant._id, message);
//       }
//     } catch (error) {
//       console.error('Error sending push notifications:', error);
//     }
//   }

//   // Get Socket.IO instance for external use
//   public getIO(): SocketServer {
//     return this.io;
//   }
// }

const socketService = {
 initSocketHandlers
}
export {socketService};