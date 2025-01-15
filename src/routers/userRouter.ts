import express from "express";
import UserController from "@controllers/userController";
import { authorize, isAdmin } from "@middlewares/authorization";
import UserServices from "@services/userServices";

const router = express.Router();

router.get("/get-users", authorize, isAdmin, UserServices.getAllUsers);
router.get("/", authorize, UserController.get);
router.put("/update", authorize, UserController.update);
router.post("/block/:authId", authorize, isAdmin, UserServices.block);
router.post("/unblock/:authId", authorize, isAdmin, UserServices.unblock);

export default router;
