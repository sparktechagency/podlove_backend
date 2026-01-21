import express from "express";
import UserController from "@controllers/userController";
import { authorize } from "@middlewares/authorization";
import UserServices from "@services/userServices";
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
// router.post("/match/:id", MatchedServices.matchUser);
router.get("/match/getAll", authorize, MatchedServices.getMatchedUsers);
router.get("/match/findMatch", authorize, MatchedServices.findMatch);
router.post("/match/refreshTheMatch", authorize, MatchedServices.refreshTheMatch);

router.get("/get-all-users", asyncHandler(UserController.getAll));
router.get("/get-all-premium-users", UserServices.getAllPremiumUsers);
router.get("/", authorize, asyncHandler(UserController.get));
router.get("/get-user-subscriptions",
    authorize,
    UserServices.getUserSubscriptions);
router.post("/send_survey_feedback", authorize, asyncHandler(LivePodcastController.send7daysSurveyFeedback));
router.get("/get_survey_feedback/:userId", asyncHandler(LivePodcastController.getUser7daysSurveyFeedback));
router.get("/update_user_subscription/:userId", authorize, asyncHandler(UserController.updateUserSubscriptionController));


export default router;
