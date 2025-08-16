import express from "express";
import SubscriptionPlanController from "@controllers/subscriptionPlanController";

const router = express.Router();

router.post("/create", SubscriptionPlanController.create);
router.get("/", SubscriptionPlanController.getAll);
router.get("/:id", SubscriptionPlanController.get);
router.put("/update/:id", SubscriptionPlanController.update);
router.put("/delete/:id", SubscriptionPlanController.deletes);

export default router;
