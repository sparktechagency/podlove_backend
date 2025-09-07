import http from "http";
import app from "./app";

import "dotenv/config";
import { connectDB } from "@connection/atlasDB";
import { logger } from "@shared/logger";
import Administrator from "@models/adminModel";
import to from "await-to-ts";
import { AdminAccess } from "@shared/enums";
import Privacy from "@models/privacyModel";
import ConsumerPolicy from "@models/consumerPolicyModel";
import MediaPolicy from "@models/mediaPolicyModel";
import { Server as SocketIOServer } from "socket.io";
import initSocketHandlers from "@services/socketService";
import { startPodcastScheduler } from "@services/podcastServices";
const PORT = process.env.PORT || 8000;

async function checkAdmin() {
  let error, administrator;
  [error, administrator] = await to(Administrator.find());
  if (error) throw error;
  if (!administrator || administrator.length < 1) {
    logger.info("No administrators found. Creating one...");
    [error, administrator] = await to(
      Administrator.create({
        name: "Admin",
        email: "admin@gmail.com",
        password: 123456,
        contact: "1234567890",
        access: AdminAccess.ALL,
      })
    );
    if (error) throw error;
    logger.info("Administrator created successfully. Starting server...");
  }
}

async function startServer() {
  try {
    await connectDB();
    await checkAdmin();

    await Privacy.findOrCreate();
    await ConsumerPolicy.findOrCreate();
    await MediaPolicy.findOrCreate();

    const server = http.createServer(app);
    // const socketService = new SocketService(server);
    const io = new SocketIOServer(server, {
      cors: { origin: "*" }
    });
    // const io = new SocketIOServer(server, {
    //   cors: { origin: "*"},
    // });

    initSocketHandlers(io);

    const ipaddress: any = process.env.ip || "0.0.0.0";
    server.listen(PORT, ipaddress, () => {
      logger.info(`Server is running at PORT: ${PORT}, HOST: ${ipaddress}`);
      logger.info(`Socket.IO server initialized`);
      startPodcastScheduler();
    });
  } catch (error) {
    logger.error("Failed to start the server:", error);
  }
}

startServer();