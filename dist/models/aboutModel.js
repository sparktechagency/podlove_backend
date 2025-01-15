"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const aboutSchema = new mongoose_1.Schema({
    text: {
        type: String,
        required: true,
    }
});
const About = (0, mongoose_1.model)("About", aboutSchema);
exports.default = About;
