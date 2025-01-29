"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SubscriptionPlanModel = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: [
        {
            key: { type: String, required: true },
            details: { type: String, required: true }
        }
    ],
    unitAmount: { type: String, required: true },
    interval: { type: String, enum: ["day", "week", "month", "year"], required: true },
    productId: { type: String, default: "" },
    priceId: { type: String, default: "" }
});
const SubscriptionPlan = (0, mongoose_1.model)("SubscriptionPlan", SubscriptionPlanModel);
exports.default = SubscriptionPlan;
