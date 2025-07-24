import express from "express";
import StripeServices from "@services/stripeServices";
import bodyParser from "body-parser";

const router = express.Router();
router.post(
  "/webhook",
   express.raw({ type: 'application/json' }),
  StripeServices.webhook
);

export default router;