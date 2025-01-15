"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const notFound = (req, res, next) => {
    return res.status(http_status_codes_1.default.NOT_FOUND).json({ error: "API Not Found !!" });
};
exports.notFound = notFound;
