import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import Message from "@models/messageModel";
import { logger } from "@shared/logger";


export default function initSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    const userId = socket.handshake.query.userId
    if(!userId){
        socket.emit('error',{
            message: "User Id is requerd"
        })
        return;
    }
    socket.join(userId);
    logger.info("🔌 Socket connected:", userId);

    // Join a private room between two users
    // socket.on("joinChat", ({ userId, peerId }: { userId: string; peerId: string }) => {
    //   const roomName = [userId, peerId].sort().join("_");
      
    //   console.log(`${userId} joined room ${roomName}`);
    // });

    // Handle incoming messages
    socket.on("sendMessage", async ({to, text }: {to: string; text: string }) => {
          console.log("message", to, text)
      const roomName = [userId, to].sort().join("_");
      try {
        // Persist message
        const msgDoc = await Message.create({
          chatRoom: roomName,
          sender: userId,
          receiver: new mongoose.Types.ObjectId(to),
          text,
          createdAt: new Date(),
        });
        console.log("msgDoc", msgDoc)
        // Broadcast to room
        io.to(roomName).emit("newMessage", {
          id: msgDoc._id,
          userId,
          to,
          text,
          createdAt: msgDoc.createdAt,
        });
      } catch (err) {
        console.error("Failed to save or emit message:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected:", socket.id);
    });
  });
}
