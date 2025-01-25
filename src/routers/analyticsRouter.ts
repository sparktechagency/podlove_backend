import express from "express";
import AnalyticsController from "@controllers/analyticsControllers";
import { authorize, isAdmin } from "@middlewares/authorization";
const router = express.Router();

router.get("/:year", AnalyticsController.getAnalytics);

export default router;
