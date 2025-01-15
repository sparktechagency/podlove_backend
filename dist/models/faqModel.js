"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const faqSchema = new mongoose_1.default.Schema({
    question: {
        type: String,
    },
    answer: {
        type: String,
    },
});
const Faq = mongoose_1.default.model("Faq", faqSchema);
exports.default = Faq;
