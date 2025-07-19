import Stripe from "stripe";
import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import to from "await-to-ts";
import { SubscriptionStatus } from "@shared/enums";
import { StatusCodes } from "http-status-codes";
import User from "@models/userModel";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const payload = JSON.stringify({
  type: "invoice.payment_succeeded",
  data:{}
});

const header = stripe.webhooks.generateTestHeaderString({
  payload,
  secret: process.env.STRIPE_SECRET_KEY!,
  timestamp: Math.floor(Date.now() / 1000),
});

const webhook = async (req: Request, res: Response, next: NextFunction):Promise<any> => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const signature = header;
  // const signature = req.headers["stripe-signature"] as string | undefined;
  let stripeEvent: Stripe.Event;

  // 1) Verify signature if secret is provided
  if (endpointSecret) {
    if (!signature) {
      return next(createError(
        StatusCodes.FORBIDDEN,
        "Missing Stripe signature header"
      ));
    }

    try {
      stripeEvent = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret
      );
    } catch (err: any) {
      console.error("⚠️  Webhook signature verification failed:", err.message);
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send(`Webhook Error: ${err.message}`);
    }
  } else {
    // If no secret, assume body is already a Stripe.Event
    stripeEvent = req.body as Stripe.Event;
  }

  // 2) Handle the event
  try {
    switch (stripeEvent.type) {
      case "invoice.payment_succeeded": {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );

        const { plan, fee, userId } = subscription.metadata;
        if (!userId) {
          console.warn("⚠️  invoice.payment_succeeded missing metadata.userId");
          break;
        }

        const [findErr, user] = await to(User.findById(userId));
        if (findErr) throw findErr;
        if (!user) {
          console.warn(`⚠️  User not found with ID ${userId}`);
          break;
        }

        user.subscription = {
          id: subscription.id,
          plan,
          fee,
          startedAt: new Date(),
          status: SubscriptionStatus.PAID,
        };

        const [saveErr] = await to(user.save());
        if (saveErr) throw saveErr;

        console.info(
          `✅  Subscription for user ${userId} marked PAID (subscription ${subscription.id})`
        );
        break;
      }

      case "invoice.payment_failed": {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );

        const { plan, fee, userId } = subscription.metadata;
        if (!userId) {
          console.warn("⚠️  invoice.payment_failed missing metadata.userId");
          break;
        }

        const [findErr, user] = await to(User.findById(userId));
        if (findErr) throw findErr;
        if (!user) {
          console.warn(`⚠️  User not found with ID ${userId}`);
          break;
        }

        user.subscription = {
          ...user.subscription!,
          status: SubscriptionStatus.FAILED,
        };

        const [saveErr] = await to(user.save());
        if (saveErr) throw saveErr;

        console.info(
          `⚠️  Subscription payment failed for user ${userId} (subscription ${subscription.id})`
        );
        break;
      }

      default:
        console.log(`ℹ️  Unhandled Stripe event type: ${stripeEvent.type}`);
    }

    // 3) Acknowledge receipt of the event
    res.status(StatusCodes.OK).send("Received");
  } catch (err) {
    console.error("❌  Error handling Stripe webhook:", err);
    next(err);
  }
};

// const webhook = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
//   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
//   let event = req.body;
//   if (endpointSecret) {
//     const signature = req.headers["stripe-signature"];
//     if (!signature) next(createError(StatusCodes.FORBIDDEN, "Unauthorized"));
//     try {
//       event = stripe.webhooks.constructEvent(req.body, signature!, endpointSecret);
//     } catch (error: any) {
//       console.log(`Webhook signature verification failed:`, error.message);
//       return res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
//     }
//   }

//   let error, user, invoice;
//   switch (event.type) {
//     case "invoice.payment_succeeded":
//       console.log("in");
//       invoice = event.data.object as Stripe.Invoice;
//       console.log(invoice);
//       const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
//       const plan = subscription.metadata.plan;
//       const fee = subscription.metadata.fee;
//       const userId = subscription.metadata.userId;

//       [error, user] = await to(User.findById(userId));
//       if (error) throw error;
//       if (!user) throw new Error("User not found");

//       user.subscription!.id = subscription.id;
//       user.subscription!.plan = plan;
//       user.subscription!.fee = fee;
//       user.subscription!.startedAt = new Date();
//       user.subscription!.status = SubscriptionStatus.PAID;

//       [error] = await to(user.save());
//       if (error) throw error;

//       break;

//     // case "invoice_payment_failed":
//     //   invoice = event.data.object as Stripe.Invoice;

//     //   const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
//     //   const plan = subscription.metadata.plan;
//     //   const fee = Number.parseFloat(subscription.metadata.fee);
//     //   const userId = subscription.metadata.userId;

//     //   [error, user] = await to(User.findById(userId));
//     //   if (error) throw error;
//     //   if(!user) throw new Error("User not found");

//     //   user.subscription!.plan = plan;
//     //   user.subscription!.fee = fee;
//     //   user.subscription!.startedAt = new Date();
//     //   user.subscription!.status = SubscriptionStatus.PAID;

//     //   [error] = await to(user.save());
//     //   if(error) throw error;

//       break;
//   }
// };

const StripeServices = {
  webhook,
};

export default StripeServices;
