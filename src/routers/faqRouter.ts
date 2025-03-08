import FaqController from "@controllers/faqControllers";
import express from "express";
import { admin_authorize, authorize } from "@middlewares/authorization";
import { asyncHandler } from "@shared/asyncHandler";

const router = express.Router();

router.post("/create", admin_authorize, asyncHandler(FaqController.create));
router.get("/", authorize, asyncHandler(FaqController.get));
router.patch("/update/:id", admin_authorize, asyncHandler(FaqController.update));
router.delete("/delete/:id", admin_authorize, asyncHandler(FaqController.remove));

export default router;
