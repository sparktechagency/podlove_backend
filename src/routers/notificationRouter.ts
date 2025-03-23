import express from "express";
import { authorize } from "@middlewares/authorization";
import { asyncHandler, asyncSessionHandler } from "@shared/asyncHandler";
import NotificationController from "@controllers/notificationController";

const router = express.Router();

router.get("/", authorize, asyncHandler(NotificationController.get));

export default router;