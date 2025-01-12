import AuthController from "@controllers/authController";
import express from "express";
import { authorize, recoveryAuthorize, refreshAuthorize } from "@middlewares/authorization";
import fileUpload from "express-fileupload";
import fileHandler from "@middlewares/fileHandler";

const authRouter = express.Router();

authRouter.post("/register", AuthController.register);
// authRouter.post("/activate", AuthController.activate);
// authRouter.post("/login", AuthController.login);
// authRouter.post("/forgot-password", AuthController.forgotPassword);
// authRouter.post("/recovery-verification", AuthController.recoveryVerification);
// authRouter.put("/reset-password", recoveryAuthorize, AuthController.resetPassword);
// authRouter.post("/resend-otp", AuthController.resendOTP);
// authRouter.put("/change-password", authorize, AuthController.changePassword);
// authRouter.delete("/delete", authorize, AuthController.remove);
// authRouter.get("/access-token", refreshAuthorize, AuthController.getAccessToken);

export default authRouter;
