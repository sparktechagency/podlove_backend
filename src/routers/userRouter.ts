import express from "express";
import UserController from "@controllers/userController";
import { authorize, isAdmin } from "@middlewares/authorization";
import UserServices from "@services/userServices";
import fileUpload from "express-fileupload";
import fileHandler from "@middlewares/fileHandler";

const router = express.Router();

router.get("/get-all-users", UserServices.getAllUsers);
router.get("/get-all-premium-users", UserServices.getAllPremiumUsers);
router.get("/", authorize, UserController.get);
router.put("/update", fileUpload(), fileHandler, authorize, UserController.update);
router.post("/block/:authId", UserServices.block);
router.post("/unblock/:authId", UserServices.unblock);

export default router;
