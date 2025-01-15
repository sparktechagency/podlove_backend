"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tacSchema = new mongoose_1.Schema({
    text: {
        type: String,
    },
});
const TaC = (0, mongoose_1.model)("TaC", tacSchema);
exports.default = TaC;
