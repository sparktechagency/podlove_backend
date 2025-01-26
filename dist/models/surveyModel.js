"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const surveySchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId },
    first: { type: Number },
    second: { type: Number },
    third: { type: String },
    fourth: { type: Number },
    fifth: { type: Number },
    six: { type: Number },
    seven: { type: String },
    eight: { type: Number },
    nine: { type: Number },
    ten: { type: String },
    eleven: { type: Number },
    twelve: { type: Number },
    thirteen: { type: String },
    fourteen: { type: Number },
    fifteen: { type: Boolean },
    sixteen: { type: String },
    seventeen: { type: String },
    eighteen: { type: String },
    nineteen: { type: String },
}, {
    timestamps: true,
});
const Survey = (0, mongoose_1.model)("Survey", surveySchema);
exports.default = Survey;
