import express from "express";
import bodyParser from "body-parser";
import StripeServices from "@services/stripeServices";

const router = express.Router();
router.post(
  "/webhook",
  //  express.raw({ type: 'application/json' }),
  bodyParser.raw({ type: "application/json" }),
  StripeServices.webhook
);


export default router;