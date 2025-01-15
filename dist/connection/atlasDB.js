"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
require("dotenv/config");
const logger_1 = require("../shared/logger");
const clientOptions = {
    serverApi: { version: "1", strict: true, deprecationErrors: true },
};
async function connectDB() {
    try {
        await mongoose_1.default.connect(process.env.ATLAS_URI, clientOptions);
        await mongoose_1.default.connection.db.admin().command({ ping: 1 });
        logger_1.logger.info("Successfully Connected to MongoDB Atlas");
    }
    catch (error) {
        logger_1.logger.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    }
}
