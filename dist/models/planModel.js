"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const planSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    unitAmount: {
        type: Number,
        required: true,
        default: 0,
    },
    interval: {
        type: String,
        enum: ["day", "week", "month", "year"],
    },
    productId: {
        type: String,
        default: "",
    },
    priceId: {
        type: String,
        default: "",
    },
});
const Plan = (0, mongoose_1.model)("Plan", planSchema);
exports.default = Plan;
