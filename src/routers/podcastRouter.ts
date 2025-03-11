import express from "express";
import PodcastController from "@controllers/podcastController";
import PodcastServices from "@services/podcastServices";
import { authorize } from "@middlewares/authorization";
import { asyncHandler } from "@shared/asyncHandler";

const router = express.Router();

router.get("/get-new-podcasts", PodcastServices.getAllNotScheduledPodcasts);
router.get("/get-done-podcasts", PodcastServices.getAllDonePodcasts);
router.post("/create", authorize, asyncHandler(PodcastController.create));
router.post("/set-schedule", PodcastServices.setSchedule);
router.post("/select-user", PodcastServices.selectUser);
router.post("/podcast-done", PodcastServices.podcastDone);
router.get("/", PodcastController.getPodcasts);

export default router;
