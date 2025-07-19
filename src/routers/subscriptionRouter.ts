import express from "express";
import SubscriptionServices from "@services/subscriptionServices";
import { authorize } from "@middlewares/authorization";

const router = express.Router();

router.post("/upgrade", authorize, SubscriptionServices.upgrade);
router.post("/cancel", authorize, SubscriptionServices.cancel);

export default router;
