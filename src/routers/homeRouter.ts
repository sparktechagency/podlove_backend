import HomeServices from "@services/homeServices";
import express from "express";
import { authorize } from "@middlewares/authorization";
import { asyncHandler } from "@shared/asyncHandler";
import LivePodcastController from "src/podcast/podcast.controller";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get("/", authorize, asyncHandler(HomeServices.homeData));
router.post("/upload-video",
    upload.single("video"),
    asyncHandler(LivePodcastController.uploadVideos));
router.get("/get-video",
    asyncHandler(LivePodcastController.getExistingVideos));

router.delete("/delete-video/:videoId",
    asyncHandler(LivePodcastController.deleteVideo));

router.patch("/update-sms-policy",
    asyncHandler(LivePodcastController.addUpdateSMSPolicy));
router.get("/get-sms-policy",
    asyncHandler(LivePodcastController.getSMSPolicy));
router.patch("/update-media-policy",
    asyncHandler(LivePodcastController.addUpdateMediaPolicy));
router.get("/get-media-policy",
    asyncHandler(LivePodcastController.getMediaPolicy));

export default router;