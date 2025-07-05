import express from "express";
import PodcastController from "@controllers/podcastController";
import PodcastServices from "@services/podcastServices";
import { admin_authorize, authorize } from "@middlewares/authorization";
import { asyncHandler } from "@shared/asyncHandler";
import { upload } from "@utils/multerConfig";

const router = express.Router();

router.post("/create", authorize, asyncHandler(PodcastController.create));
router.patch("/send-podcast-request", authorize, PodcastController.sendPodcastRequest);
router.post("/recordings/:id", authorize, upload.single("recording"), PodcastController.updateRecording);
router.post("/start-podcast/:id", authorize, PodcastController.startPodcast);
router.get("/record-get-podcast/:id", admin_authorize, PodcastController.getAdminRecordedPodcast);
router.post("/set-schedule", PodcastServices.setSchedule);
router.post("/select-user", PodcastServices.selectUser);
router.post("/podcast-done", PodcastServices.podcastDone);
router.get("/", asyncHandler(PodcastController.getPodcasts));

export default router;
