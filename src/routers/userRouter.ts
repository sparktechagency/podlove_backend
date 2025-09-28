import express from "express";
import UserController from "@controllers/userController";
import { authorize } from "@middlewares/authorization";
import UserServices from "@services/userServices";
import fileUpload from "express-fileupload";
import fileHandler from "@middlewares/fileHandler";
import MatchedServices from "@services/matchesServices";
import { asyncHandler } from "@shared/asyncHandler";
import { upload } from "@utils/multerConfig";
import LivePodcastController from "src/podcast/podcast.controller";

const router = express.Router();

router.patch("/update", authorize, upload.single("avatar"), asyncHandler(UserController.update));
router.post("/block/:authId", UserServices.block);
router.post("/unblock/:authId", UserServices.unblock);
// router.post("/validate-bio", authorize, asyncHandler(UserController.update));
router.post("/validate-bio", authorize, asyncHandler(UserServices.validateBio));
router.post("/match/:id", MatchedServices.matchUser);
router.get("/match/getAll", authorize, MatchedServices.getMatchedUsers);
router.get("/match/findMatch", authorize, MatchedServices.findMatch);
router.get("/get-all-users", asyncHandler(UserController.getAll));
router.get("/get-all-premium-users", UserServices.getAllPremiumUsers);
router.get("/", authorize, asyncHandler(UserController.get));
router.post("/send_survey_feedback", authorize, asyncHandler(LivePodcastController.send7daysSurveyFeedback));
router.post("/get_survey_feedback/:userId", asyncHandler(LivePodcastController.getUser7daysSurveyFeedback));



export default router;
