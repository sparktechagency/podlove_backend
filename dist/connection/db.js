"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const connectDB = async (uri) => {
    const [error] = await (0, await_to_ts_1.default)(mongoose_1.default.connect(uri));
    if (error) {
        console.error(error);
        return;
    }
    console.log("Database connected successfully");
};
exports.default = connectDB;
