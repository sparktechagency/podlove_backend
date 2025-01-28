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
router.post("/change-password", isAdmin, AdministratorController.changePassword);
router.post("/send-message", AdminServices.sendMessage);
router.put("/update", fileUpload(), fileHandler, isAdmin, AdministratorController.update);
router.put("/update/:id", isAdmin, AdministratorController.updateAdmin);
router.delete("remove/:id", AdministratorController.remove);
router.post("/forgot-password", AdministratorController.forgotPassword);
router.post("/verify-email", AdministratorController.verifyEmail);
router.put("/reset-password", AdministratorController.resetPassword);
router.get("/info", isAdmin, AdministratorController.getAdminInfo);
router.get("/", AdministratorController.getAll);

export default router;
