import express from "express";
import SubscriptionServices from "@services/subscriptionServices";
import { authorize, isAdmin } from "@middlewares/authorization";

const router = express.Router();

router.post("/upgrade", authorize, SubscriptionServices.upgrade);
router.post("/cancel", SubscriptionServices.cancel);

export default router;
