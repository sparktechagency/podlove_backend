import Stripe from "stripe";
import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import to from "await-to-ts";
import { SubscriptionStatus } from "@shared/enums";
import { StatusCodes } from "http-status-codes";
import User from "@models/userModel";
import mongoose, { Types } from "mongoose";
import Notification from "@models/notificationModel";
import { ageToDOB } from "@utils/ageUtils";
import { calculateDistance } from "@utils/calculateDistanceUtils";
import Podcast from "@models/podcastModel";
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const MODEL = "gpt-4o";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const getCompatibilityScore = async (userOneAnswers: string[], userTwoAnswers: string[]) => {
  const questions = [
    "Do you prefer spending your weekends socializing in larger gatherings or relaxing at home with a few close friends?",
    "When faced with a major life decision, do you usually follow your head (logic) or your heart (feelings)?",
    "Which of these activities sounds most appealing to you?",
    "How important is personal growth in your life?",
    "How do you like to show affection?",
    "How do you envision your ideal future?",
    "Do you have kids?",
    "Do you want kids in the future?",
    "Will you date a person who has kids?",
    "Do you smoke?",
    "Will you date a smoker?",
    "How would you describe your drinking habits?",
    "If 'Never', would you be comfortable dating someone who drinks?",
    "Do you consider yourself religious or spiritual?",
    "If 'Religious', what is your religion or denomination?",
    "If 'Spiritual', would you like to describe your spiritual beliefs?",
    "How important is religion or spirituality in your life?",
    "Would you date someone with different religious or spiritual beliefs?",
    "How would you describe your level of political engagement?",
    "Would you date someone with different political beliefs?",
    "Do you have pets?",
    "If yes, which pet do you have?",
  ];

  let userContent = "Below are 22 questions, followed by each user's responses.\n";
  userContent += "Please produce a single compatibility score between 0 and 100.\n\n";

  for (let i = 0; i < questions.length; i++) {
    userContent += `Question ${i + 1}: ${questions[i]}\n`;
    userContent += `User1: ${userOneAnswers[i]}\n`;
    userContent += `User2: ${userTwoAnswers[i]}\n\n`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 50,
      messages: [
        {
          role: "system",
          content: `
      You are a dating compatibility algorithm.
      Given the questions and each user's responses, produce a single numeric compatibility score (0-100).
      Your answer must be strictly a number with no extra text or punctuation.
    `,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });
    const rawOutput = response.choices[0].message!.content!.trim();
    const numericRegex = /^\d+(\.\d+)?$/;
    if (!numericRegex.test(rawOutput)) {
      throw new Error(`Output is not strictly a number: "${rawOutput}"`);
    }
    return parseFloat(rawOutput);
  } catch (error: any) {
    console.error("Error during API call:", error.response?.data || error.message);
    return null;
  }
};
async function findMatches(
  userId: string,
  answers: string[],
  limitCount: number,
): Promise<any[]> {
  // 1) Load user
  const user = await User.findById(userId, {});
  if (!user) throw new Error("User not found");

  // 2) Ensure answers array
  answers = answers?.length ? answers : user.compatibility || [];

  // 3) Save/update user's compatibility answers
  await User.findByIdAndUpdate(userId, { compatibility: answers }).exec();

  const pref = user.preferences;

  // 4) Fetch candidates matching preferences
  let candidates = await User.find(
    {
      _id: { $ne: user._id },
      dateOfBirth: { $gte: ageToDOB(pref.age.max), $lte: ageToDOB(pref.age.min) },
      gender: { $in: pref.gender },
      bodyType: { $in: pref.bodyType },
      ethnicity: { $in: pref.ethnicity },
      "location.latitude": { $exists: true },
      "location.longitude": { $exists: true },
    },
    null,
  ).lean();

  // 5) Distance filtering (strict)
  const nearby = candidates.filter((c) => {
    const dist = calculateDistance(
      user.location.latitude,
      user.location.longitude,
      c.location.latitude,
      c.location.longitude
    );
    return dist <= pref.distance;
  });

  // 6) Fallback if not enough users
  let finalCandidates = nearby;
  if (nearby.length < limitCount) {
    const fallback = await User.find(
      {
        _id: { $ne: user._id },
        gender: { $in: pref.gender },
        "location.latitude": { $exists: true },
        "location.longitude": { $exists: true },
      },
      null,
    ).lean();

    const fallbackNearby = fallback.filter((c) => {
      const dist = calculateDistance(
        user.location.latitude,
        user.location.longitude,
        c.location.latitude,
        c.location.longitude
      );
      return dist <= pref.distance;
    });

    finalCandidates = [...nearby, ...fallbackNearby];
  }

  // 7) Compute compatibility scores
  const scored = await Promise.all(
    finalCandidates.map(async (c) => ({
      user: c,
      score: await getCompatibilityScore(answers, c.compatibility || []),
    }))
  );

  // 8) Sort & return top N
  return scored
    .map((item) => ({
      user: item.user._id,
      score: item.score ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limitCount);
}

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
        // console.log("subscription.metadata: ", subscription.metadata);
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
        // const filter = { _id: userId };
        // const update = { $set: { subscription: subUpdate } };
        // const [updErr, writeResult] = await to(
        //   User.updateOne(filter, update, {
        //     runValidators: false,
        //     lean: true,
        //   })
        // );
        // if (updErr) throw updErr;

        // // console.log("writeResult: ", writeResult);
        // console.log("sub update: ", subUpdate);
        // console.log("user: ", userId);
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $set: subUpdate },
          { new: true, runValidators: false, upsert: true }
        );

        if (!updatedUser) {
          console.warn(`⚠️  User not found: ${userId}`);
          break;
        }

        // Now you can safely use: 
        console.info(`✅  Marked subscription PAID for user ${userId} (sub ${subscription.id})`);

        let score = 2
        if (fee === "Free") score = 2
        if (fee === "14.99") score = 3
        if (fee === "29.99") score = 4

        const topMatches = await findMatches(userId, updatedUser.compatibility || [], score);


        const participants = topMatches.map(m => ({
          user: m.user,
          score: m.score
        }));

        const podcast = await Podcast.findOneAndUpdate(
          { primaryUser: userId },
          { participants },
          { new: true, upsert: true }
        );

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
      // console.log(`ℹ️  Unhandled Stripe event type: ${stripeEvent.type}`);
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
