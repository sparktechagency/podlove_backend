import HomeServices from "@services/homeServices";
import express from "express";
import { authorize } from "@middlewares/authorization";
import { asyncHandler } from "@shared/asyncHandler";

const router = express.Router();

router.get("/", authorize, asyncHandler(HomeServices.homeData));

export default router;