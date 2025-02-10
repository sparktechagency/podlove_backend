import express from "express";
import UserController from "@controllers/userController";
import { authorize } from "@middlewares/authorization";
import UserServices from "@services/userServices";
import fileUpload from "express-fileupload";
import fileHandler from "@middlewares/fileHandler";
import MatchedServices from "@services/matchesServices";

const router = express.Router();

router.patch("/update/:id", UserController.update);
router.post("/block/:authId", UserServices.block);
router.post("/unblock/:authId", UserServices.unblock);
// router.post("/match/:id", MatchedServices.match);
router.get("/match/getAll/:id", MatchedServices.matchedUsers);
router.get("/get-all-users", UserServices.getAllUsers);
router.get("/get-all-premium-users", UserServices.getAllPremiumUsers);
router.get("/", authorize, UserController.get);

export default router;
