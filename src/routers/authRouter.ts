import AuthController from "@controllers/authController";
import express from "express";
import { authorize, recoveryAuthorize } from "@middlewares/authorization";

const authRouter = express.Router();

authRouter.post("/register", AuthController.register);
authRouter.post("/activate", AuthController.activate);
authRouter.post("/login", AuthController.login);
authRouter.post("/forgot-password", AuthController.forgotPassword);
authRouter.post("/verify-email", AuthController.verifyEmail);
authRouter.put("/reset-password", recoveryAuthorize, AuthController.resetPassword);
authRouter.post("/resend-otp", AuthController.resendOTP);
authRouter.put("/change-password", authorize, AuthController.changePassword);

export default authRouter;
