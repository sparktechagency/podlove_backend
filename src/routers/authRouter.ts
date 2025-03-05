import AuthController from "@controllers/authController";
import express from "express";
import { authorize } from "@middlewares/authorization";
import { asyncHandler, asyncSessionHandler } from "@shared/asyncHandler";

const router = express.Router();

router.post("/register", asyncSessionHandler(AuthController.register));
router.post("/activate", asyncHandler(AuthController.activate));
router.post("/login", asyncHandler(AuthController.login));
router.post("/sign-in-with-google", asyncHandler(AuthController.signInWithGoogle));
router.post("/resend-otp", asyncHandler(AuthController.resendOTP));
router.post("/recovery", asyncHandler(AuthController.recovery));
router.post("/recovery-verification", asyncHandler(AuthController.recoveryVerification));
router.post("/reset-password", asyncHandler(AuthController.resetPassword));
router.post("/change-password", authorize, asyncHandler(AuthController.changePassword));
router.delete("/delete", authorize, asyncHandler(AuthController.remove));

export default router;
