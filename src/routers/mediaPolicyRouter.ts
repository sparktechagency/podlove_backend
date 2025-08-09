import express from "express";
import MediaPolicyController from "@controllers/mediaPolicyControllers";
import { admin_authorize, authorize } from "@middlewares/authorization";
import { asyncHandler } from "@shared/asyncHandler";

const router = express.Router();

router.get("/", asyncHandler(MediaPolicyController.get));
router.patch("/update", admin_authorize, asyncHandler(MediaPolicyController.update));

export default router;
