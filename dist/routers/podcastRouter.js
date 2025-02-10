"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const podcastController_1 = __importDefault(require("@controllers/podcastController"));
const podcastServices_1 = __importDefault(require("@services/podcastServices"));
const router = express_1.default.Router();
router.get("/get-new-podcasts", podcastServices_1.default.getAllNotScheduledPodcasts);
router.get("/get-done-podcasts", podcastServices_1.default.getAllDonePodcasts);
router.post("/create", podcastController_1.default.create);
router.post("/set-schedule", podcastServices_1.default.setSchedule);
router.post("/select-user", podcastServices_1.default.selectUser);
router.post("/podcast-done", podcastServices_1.default.podcastDone);
router.get("/", podcastController_1.default.getAll);
router.get("/:id", podcastController_1.default.get);
exports.default = router;
