"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("@shared/enums");
const mongoose_1 = require("mongoose");
const analyticsSchema = new mongoose_1.Schema({
    month: {
        type: String,
        enum: enums_1.Months,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    income: {
        type: Number,
    },
    active: {
        type: Number,
    },
    cancel: {
        type: Number,
    },
});
const Analytics = (0, mongoose_1.model)("Analytics", analyticsSchema);
exports.default = Analytics;
