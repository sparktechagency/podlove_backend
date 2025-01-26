import express from "express";
import PodcastController from "@controllers/podcastController";
import PodcastServices from "@services/podcastServices";
import { authorize } from "@middlewares/authorization";

const router = express.Router();

router.get("/get-new-podcasts", PodcastServices.getAllNotScheduledPodcasts);
router.get("/get-done-podcasts", PodcastServices.getAllDonePodcasts);
router.post("/create", PodcastController.create);
router.post("/set-schedule", PodcastServices.setSchedule);
router.post("/select-user", PodcastServices.selectUser);
router.post("/podcast-done", PodcastServices.podcastDone);
router.get("/", PodcastController.getAll);
router.get("/:id", PodcastController.get);

export default router;