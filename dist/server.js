"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
require("dotenv/config");
const atlasDB_1 = require("@connection/atlasDB");
const logger_1 = require("@shared/logger");
const administratorModel_1 = __importDefault(require("@models/administratorModel"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const enums_1 = require("@shared/enums");
const PORT = process.env.PORT || 8000;
async function checkAdmin() {
    let error, administrator;
    [error, administrator] = await (0, await_to_ts_1.default)(administratorModel_1.default.find());
    if (error)
        throw error;
    if (!administrator || administrator.length < 1) {
        logger_1.logger.info("No administrators found. Creating one...");
        [error, administrator] = await (0, await_to_ts_1.default)(administratorModel_1.default.create({
            name: "Admin",
            email: "admin@gmail.com",
            password: 123456,
            contact: "1234567890",
            access: enums_1.AdminAccess.ALL
        }));
        if (error)
            throw error;
        logger_1.logger.info("Administrator created successfully. Starting server...");
    }
}
async function startServer() {
    try {
        await (0, atlasDB_1.connectDB)();
        await checkAdmin();
        const server = http_1.default.createServer(app_1.default);
        server.listen(PORT, () => {
            logger_1.logger.info(`Server is running at PORT: ${PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to start the server:", error);
    }
}
startServer();
