import AuthController from "@controllers/authController";
import express from "express";
import { authorize, recoveryAuthorize } from "@middlewares/authorization";

const authRouter = express.Router();

authRouter.post("/register", AuthController.register);
authRouter.post("/activate", AuthController.activation);
authRouter.post("/login", AuthController.login);
authRouter.post("/recovery", AuthController.forgotPassword);
authRouter.post("/recovery-verify", AuthController.recovery);
authRouter.put("/reset-password", recoveryAuthorize, AuthController.resetPassword);
authRouter.post("/resend-otp", AuthController.resendOTP);
authRouter.post("/change-password", authorize, AuthController.changePassword);
authRouter.delete("/delete", authorize, AuthController.remove);

export default authRouter;
