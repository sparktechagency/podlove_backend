import express from "express";
import AnalyticsController from "@controllers/analyticsControllers";
import { authorize } from "@middlewares/authorization";

const router = express.Router();

router.get("/income/:year", AnalyticsController.getIncomeByYear);
router.get("/subscription/:year", AnalyticsController.getSubscriptionByYear);
router.get("/", AnalyticsController.getAnalytics);

export default router;
