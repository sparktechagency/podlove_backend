"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authController_1 = __importDefault(require("../controllers/authController"));
const express_1 = __importDefault(require("express"));
const authorization_1 = require("../middlewares/authorization");
const authRouter = express_1.default.Router();
authRouter.post("/register", authController_1.default.register);
authRouter.post("/activate", authController_1.default.activate);
authRouter.post("/login", authController_1.default.login);
authRouter.post("/forgot-password", authController_1.default.forgotPassword);
authRouter.post("/verify-email", authController_1.default.verifyEmail);
authRouter.put("/reset-password", authorization_1.recoveryAuthorize, authController_1.default.resetPassword);
authRouter.post("/resend-otp", authController_1.default.resendOTP);
authRouter.put("/change-password", authorization_1.authorize, authController_1.default.changePassword);
exports.default = authRouter;
