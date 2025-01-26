import http from "http";
import app from "./app";

import "dotenv/config";
import { connectDB } from "@connection/atlasDB";
import { logger } from "@shared/logger";
import Administrator from "@models/administratorModel";
import to from "await-to-ts";
import { AdminAccess } from "@shared/enums";

const PORT = process.env.PORT || 8000;

async function checkAdmin() {
  let error, administrator;
  [error, administrator] = await to(Administrator.find());
  if (error) throw error;
  if (!administrator || administrator.length < 1) {
    logger.info("No administrators found. Creating one...");
    [error, administrator] = await to(Administrator.create({
      name: "Admin",
      email: "admin@gmail.com",
      password: 123456,
      contact: "1234567890",
      access: AdminAccess.ALL
    }));
    if (error) throw error;
    logger.info("Administrator created successfully. Starting server...");
  }
}

async function startServer() {
  try {
    await connectDB();
    await checkAdmin();
    const server = http.createServer(app);
    server.listen(PORT, () => {
      logger.info(`Server is running at PORT: ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start the server:", error);
  }
}

startServer();
