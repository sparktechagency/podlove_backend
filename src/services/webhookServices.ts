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
    if (!signature) next(createError(StatusCodes.FORBIDDEN, "Unauthorized"));
    try {
      event = stripe.webhooks.constructEvent(req.body, signature!, endpointSecret);
    } catch (error: any) {
      console.log(`Webhook signature verification failed:`, error.message);
      return res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
    }
  }

  let error, subscriptionId, user, invoice;
  switch (event.type) {
    case "invoice.payment_succeeded":
      invoice = event.data.object as Stripe.Invoice;

      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const plan = subscription.metadata.plan;
      const fee = Number.parseFloat(subscription.metadata.fee);
      const userId = subscription.metadata.userId;

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

    // case "invoice_payment_failed":
    //   invoice = event.data.object as Stripe.Invoice;

    //   const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    //   const plan = subscription.metadata.plan;
    //   const fee = Number.parseFloat(subscription.metadata.fee);
    //   const userId = subscription.metadata.userId;

    //   [error, user] = await to(User.findById(userId));
    //   if (error) throw error;
    //   if(!user) throw new Error("User not found");

    //   user.subscription!.plan = plan;
    //   user.subscription!.fee = fee;
    //   user.subscription!.startedAt = new Date();
    //   user.subscription!.status = SubscriptionStatus.PAID;

    //   [error] = await to(user.save());
    //   if(error) throw error;

    //   break;
  }
};

const controller = {
  webhook,
};

export default controller;
