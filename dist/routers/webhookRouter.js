"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stripeServices_1 = __importDefault(require("../services/stripeServices"));
const body_parser_1 = __importDefault(require("body-parser"));
const router = express_1.default.Router();
router.post("/webhook", body_parser_1.default.raw({ type: "application/json" }), stripeServices_1.default.webhook);
exports.default = router;
