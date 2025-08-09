import express from "express";
import PrivacyController from "@controllers/privacyControllers";
import { admin_authorize, authorize } from "@middlewares/authorization";
import { asyncHandler } from "@shared/asyncHandler";

const router = express.Router();

router.get("/", asyncHandler(PrivacyController.get));
router.patch("/update", admin_authorize, asyncHandler(PrivacyController.update));
// admin_authorize,

export default router;
