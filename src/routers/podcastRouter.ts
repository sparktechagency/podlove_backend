import express from "express";
import PodcastController from "@controllers/podcastController";
import PodcastServices from "@services/podcastServices";
import { authorize } from "@middlewares/authorization";
import { asyncHandler } from "@shared/asyncHandler";

const router = express.Router();

router.post("/create", authorize, asyncHandler(PodcastController.create));
router.patch("/send-podcast-request", authorize, PodcastController.sendPodcastRequest);
router.post("/set-schedule", PodcastServices.setSchedule);
router.post("/select-user", PodcastServices.selectUser);
router.post("/podcast-done", PodcastServices.podcastDone);
router.get("/", asyncHandler(PodcastController.getPodcasts));

export default router;
