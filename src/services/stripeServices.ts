import Stripe from "stripe";
import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import to from "await-to-ts";
import { SubscriptionStatus } from "@shared/enums";
import { StatusCodes } from "http-status-codes";
import User from "@models/userModel";
import { Types } from "mongoose";
import Notification from "@models/notificationModel";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhook = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const sig = req.headers["stripe-signature"];
  let stripeEvent: Stripe.Event;

  // 2) Verify signature
  if (!sig) {
    return next(createError(StatusCodes.FORBIDDEN, "Missing Stripe signature header"));
  }
  try {
    stripeEvent = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error("⚠️  Webhook signature verification failed:", err.message);
    return res.status(StatusCodes.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
  }

  // 3) Handle the event
  try {
    switch (stripeEvent.type) {
      case "invoice.payment_succeeded": {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const { plan, fee, userId } = subscription.metadata;
        if (!userId) {
          console.warn("⚠️  Missing metadata.userId on subscription");
          break;
        }
        const subUpdate = {
          "subscription.id": subscription.id,
          "subscription.plan": plan,
          "subscription.fee": fee,
          "subscription.startedAt": new Date(),
          "subscription.status": SubscriptionStatus.PAID,
        };

        const [updErr, user] = await to(
          User.updateOne({ _id: new Types.ObjectId(userId) }, { $set: subUpdate }, { runValidators: false })
        );
        if (updErr) throw updErr;

        if (!user) {
          console.warn(`⚠️  User not found: ${userId}`);
          break;
        }
        if (user?.modifiedCount) {
          // Create a “payment_success” notification
          const [notifErr, notification] = await to(
            Notification.create({
              type: "payment_success",
              user: userId, // the Stripe metadata userId
              message: [
                {
                  title: "Payment success!",
                  description: `You’ve successfully subscribed to Tippz for getting extra matching partner `,
                },
              ],
              read: false,
              section: "user",
            })
          );
          if (notifErr) {
            console.error("❌  Failed to create notification:", notifErr);
            // (optional) decide whether to `throw` here or just log
          } else {
            console.info(`🔔  Notification sent to user ${userId}: ${notification._id}`);
          }
        }
        console.info(`✅  Marked subscription PAID for user ${userId} (sub ${subscription.id})`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const { userId, plan } = subscription.metadata;

        if (!userId) {
          console.warn("⚠️  Missing metadata.userId on subscription");
          break;
        }

        const [findErr, user] = await to(User.findById(userId));
        if (findErr) throw findErr;
        if (!user) {
          console.warn(`⚠️  User not found: ${userId}`);
          break;
        }

        if (user.subscription) {
          user.subscription.status = SubscriptionStatus.FAILED;
        } else {
          console.warn(`⚠️  No existing subscription to mark FAILED`);
        }

        const [saveErr] = await to(user.save());
        if (saveErr) throw saveErr;
        const [notifErr, notification] = await to(
          Notification.create({
            type: "payment_failed",
            user: userId,
            message: [
              {
                title: "Payment failed",
                description: `Your subscription payment for ${plan} did not go through. Please update your payment method and try again.`,
              },
            ],
            read: false,
            section: "user",
          })
        );
        if (notifErr) {
          console.error("❌  Failed to create failure notification:", notifErr);
        } else {
          console.info(`🔔  Failure notification sent to user ${userId}: ${notification._id}`);
        }
        console.info(`⚠️  Subscription payment FAILED for user ${userId}`);
        break;
      }

      default:
        console.log(`ℹ️  Unhandled Stripe event type: ${stripeEvent.type}`);
    }

    // 4) Acknowledge receipt
    res.status(StatusCodes.OK).send("Received");
  } catch (err) {
    console.error("❌  Error handling Stripe webhook:", err);
    next(err);
  }
};
const StripeServices = {
  webhook,
};

export default StripeServices;
