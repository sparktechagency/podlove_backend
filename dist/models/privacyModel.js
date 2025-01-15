"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const privacySchema = new mongoose_1.Schema({
    text: {
        type: String,
    },
});
const Privacy = (0, mongoose_1.model)("Privacy", privacySchema);
exports.default = Privacy;
