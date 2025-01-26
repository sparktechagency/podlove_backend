import AdministratorController from "@controllers/administratorController";
import AdminServices from "@services/adminServices";
import express from "express";
import { isAdmin } from "@middlewares/admin_authorization";
import fileUpload from "express-fileupload";
import fileHandler from "@middlewares/fileHandler";
import authRouter from "@routers/authRouter";

const router = express.Router();

router.post("/create", AdministratorController.create);
router.post("/login", AdministratorController.login);
router.post("/change-password", AdministratorController.changePassword);
router.post("/send-message", AdminServices.sendMessage);
router.put("/update", fileUpload(), fileHandler, isAdmin, AdministratorController.update);
router.put("/update/:id", isAdmin, AdministratorController.updateAdmin);
router.delete("remove/:id", AdministratorController.remove);
authRouter.post("/forgot-password", AdministratorController.forgotPassword);
authRouter.post("/verify-email", AdministratorController.verifyEmail);
authRouter.put("/reset-password", isAdmin, AdministratorController.resetPassword);

export default router;
