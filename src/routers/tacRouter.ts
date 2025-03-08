import express from "express";
import TaCController from "@controllers/tacControllers";
import { admin_authorize, authorize } from "@middlewares/authorization";
import { asyncHandler } from "@shared/asyncHandler";

const router = express.Router();

router.get("/", authorize, asyncHandler(TaCController.get));
router.patch("/update", admin_authorize, asyncHandler(TaCController.update));

export default router;