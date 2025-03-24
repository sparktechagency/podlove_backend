// services/stripeService.ts

import Stripe from "stripe";
import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import to from "await-to-ts";
import { SubscriptionStatus } from "@shared/enums";
import { StatusCodes } from "http-status-codes";
import User from "@models/userModel";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhook = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event = req.body;

  if (endpointSecret) {
    const signature = req.headers["stripe-signature"];
    if (!signature) return next(createError(StatusCodes.FORBIDDEN, "Unauthorized"));

    try {
      event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    } catch (error: any) {
      console.error("Webhook signature verification failed:", error.message);
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
    }
  }

  let error, user;

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = session.subscription as string;

      if (session.metadata) {
        const { userId, plan, fee } = session.metadata;

        // Attach metadata to the subscription (so it exists when invoice is created)
        await stripe.subscriptions.update(subscriptionId, {
          metadata: {
            userId,
            plan,
            fee,
          },
        });
      }
      break;

    case "invoice.payment_succeeded":
      const invoice = event.data.object as Stripe.Invoice;

      const subId = invoice.subscription as string;

      const subscription = await stripe.subscriptions.retrieve(subId);
      const { plan, fee, userId } = subscription.metadata;

      if (!userId) {
        console.warn("No userId in subscription metadata, skipping invoice.payment_succeeded");
        break;
      }

      [error, user] = await to(User.findById(userId));
      if (error) throw error;
      if (!user) throw new Error("User not found");

      user.subscription!.id = subscription.id;
      user.subscription!.plan = plan;
      user.subscription!.fee = fee;
      user.subscription!.startedAt = new Date();
      user.subscription!.status = SubscriptionStatus.PAID;

      [error] = await to(user.save());
      if (error) throw error;

      break;

    // Optional: Add `invoice.payment_failed` handling here
  }

  res.status(200).send(); // Always respond to Stripe to avoid retries
};

const StripeServices = {
  webhook,
};

export default StripeServices;
