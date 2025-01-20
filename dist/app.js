"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authRouter_1 = __importDefault(require("./routers/authRouter"));
const userRouter_1 = __importDefault(require("./routers/userRouter"));
const notfound_1 = require("./middlewares/notfound");
const faqRouter_1 = __importDefault(require("./routers/faqRouter"));
const tacRouter_1 = __importDefault(require("./routers/tacRouter"));
const privacyRouter_1 = __importDefault(require("./routers/privacyRouter"));
const errorHandler_1 = require("./middlewares/errorHandler");
// import WebhookRouter from "@routers/webhookRouter";
const app = (0, express_1.default)();
// app.use("/", WebhookRouter);
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
app.use("/auth", authRouter_1.default);
app.use("/user", userRouter_1.default);
app.use("/tac", tacRouter_1.default);
app.use("/faq", faqRouter_1.default);
app.use("/privacy", privacyRouter_1.default);
app.use("/", (req, res, next) => {
    res.send("Hello From Podlove");
});
app.use(notfound_1.notFound);
app.use(errorHandler_1.errorHandler);
exports.default = app;
