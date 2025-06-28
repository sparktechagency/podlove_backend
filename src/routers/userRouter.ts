import express from "express";
import UserController from "@controllers/userController";
import { authorize } from "@middlewares/authorization";
import UserServices from "@services/userServices";
import fileUpload from "express-fileupload";
import fileHandler from "@middlewares/fileHandler";
import MatchedServices from "@services/matchesServices";
import { asyncHandler } from "@shared/asyncHandler";
import { upload } from "@utils/multerConfig";

const router = express.Router();

router.patch("/update", authorize, upload.single("avatar"), asyncHandler(UserController.update));
router.post("/block/:authId", UserServices.block);
router.post("/unblock/:authId", UserServices.unblock);
router.post("/validate-bio", asyncHandler(UserServices.validateBio));
router.post("/match/:id", MatchedServices.matchUser);
// router.get("/match/getAll/:id", MatchedServices.matchedUsers);
router.get("/get-all-users", asyncHandler(UserController.getAll));
router.get("/get-all-premium-users", UserServices.getAllPremiumUsers);
router.get("/", authorize, asyncHandler(UserController.get));

export default router;
