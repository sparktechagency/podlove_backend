import AdminController from "@controllers/adminController";
import AdminServices from "@services/adminServices";
import express from "express";
import fileUpload from "express-fileupload";
import fileHandler from "@middlewares/fileHandler";
import { asyncHandler } from "@shared/asyncHandler";
import { admin_authorize } from "@middlewares/authorization";
import { upload } from "@utils/multerConfig";

const router = express.Router();

router.post("/create", AdminController.create);
router.post("/send-message", admin_authorize, AdminServices.sendMessage);
// router.put("/update", fileUpload(), fileHandler, admin_authorize, AdminController.update);
router.put("/update", upload.single("avatar"), admin_authorize, AdminController.update);
router.put("/update/:id", admin_authorize, AdminController.updateAdmin);
router.delete("/remove/:id", admin_authorize, AdminController.remove);
router.get("/info", admin_authorize, AdminController.getAdminInfo);
router.get("/", admin_authorize, AdminController.getAll);

router.post("/login", asyncHandler(AdminController.login));
router.post("/recovery", asyncHandler(AdminController.recovery));
router.post("/recovery-verification", asyncHandler(AdminController.recoveryVerification));
router.post("/reset-password", asyncHandler(AdminController.resetPassword));
router.post("/change-password", admin_authorize, asyncHandler(AdminController.changePassword));

export default router;
