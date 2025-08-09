import express from "express";
import ConsumerPolicyController from "@controllers/consumerPolicyControllers";
import { admin_authorize, authorize } from "@middlewares/authorization";
import { asyncHandler } from "@shared/asyncHandler";

const router = express.Router();

router.get("/", asyncHandler(ConsumerPolicyController.get));
router.patch("/update", admin_authorize, asyncHandler(ConsumerPolicyController.update));

export default router;
