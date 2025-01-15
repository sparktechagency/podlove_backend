"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
require("dotenv/config");
const atlasDB_1 = require("./connection/atlasDB");
const logger_1 = require("./shared/logger");
const PORT = process.env.PORT || 8000;
async function startServer() {
    try {
        await (0, atlasDB_1.connectDB)();
        const server = http_1.default.createServer(app_1.default);
        server.listen(PORT, () => {
            logger_1.logger.info(`Server is running at PORT: ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start the server:", error);
    }
}
startServer();
