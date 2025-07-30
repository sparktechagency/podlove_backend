import express from "express";
import { authorize } from "@middlewares/authorization";
import { asyncHandler, asyncSessionHandler } from "@shared/asyncHandler";
import NotificationController from "@controllers/notificationController";

const router = express.Router();

router.get("/", authorize, asyncHandler(NotificationController.get));
router.patch("/update", authorize, asyncHandler(NotificationController.updateRead));
router.delete("/delete", authorize, asyncHandler(NotificationController.deleteRead));
//  authorize,

export default router;