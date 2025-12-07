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

//=======================
async function findMatches(
  userId: string,
  answers: string[],
  limitCount: number,
  session?: mongoose.ClientSession
): Promise<any[]> {
  // 1) Load user
  const user = await User.findById(userId, {}, session ? { session } : {});
  if (!user) throw new Error("User not found");

  // 2) Ensure answers array
  answers = answers?.length ? answers : user.compatibility || [];

  // 3) Save/update user's compatibility answers
  await User.findByIdAndUpdate(
    userId,
    { compatibility: answers },
    session ? { session } : {}
  ).exec();

  const pref = user.preferences;

  // 4) Fetch candidates
  let candidates = await User.find(
    {
      _id: { $ne: user._id },
      dateOfBirth: { $gte: ageToDOB(pref.age.max), $lte: ageToDOB(pref.age.min) },
      gender: { $in: pref.gender },
      bodyType: { $in: pref.bodyType },
      ethnicity: { $in: pref.ethnicity },
      isMatch: false,
      "location.latitude": { $exists: true },
      "location.longitude": { $exists: true },
    },
    null,
    session ? { session } : {}
  ).lean();

  // 5) Strict distance filter
  const nearby = candidates.filter((c) => {
    const dist = calculateDistance(
      user.location.latitude,
      user.location.longitude,
      c.location.latitude,
      c.location.longitude
    );
    return dist <= pref.distance;
  });

  // 6) Fallback if not enough candidates
  let finalCandidates = nearby;

  if (nearby.length < limitCount) {
    const fallback = await User.find(
      {
        _id: { $ne: user._id },
        gender: { $in: pref.gender },
        isMatch: false,
        "location.latitude": { $exists: true },
        "location.longitude": { $exists: true },
      },
      null,
      session ? { session } : {}
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

  // 7) Score users
  const scored = await Promise.all(
    finalCandidates.map(async (c) => ({
      user: c,
      score: await getCompatibilityScore(answers, c.compatibility || []),
    }))
  );

  // 8) Sort & return
  return scored
    .map((item) => ({
      user: item.user._id,
      score: item.score ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limitCount);
}

const webhook = async (req: Request, res: Response, next: NextFunction) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const sig = req.headers["stripe-signature"];
  let stripeEvent: Stripe.Event;

  if (!sig) return next(createError(StatusCodes.FORBIDDEN, "Missing Stripe signature header"));

  try {
    stripeEvent = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (stripeEvent.type) {
      case "invoice.payment_succeeded": {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const invoice = stripeEvent.data.object as Stripe.Invoice;
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

          const { plan, fee, userId, subscription_id } = subscription.metadata;

          if (!userId || !Types.ObjectId.isValid(userId)) throw new Error("Invalid user ID in metadata");

          // 1) Update User Subscription
          const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
              $set: {
                "subscription.id": subscription.id,
                "subscription.subscription_id": subscription_id,
                "subscription.plan": plan,
                "subscription.fee": fee,
                "subscription.startedAt": new Date(),
                "subscription.status": SubscriptionStatus.PAID,
              },
            },
            { new: true, session }
          );

          if (!updatedUser) throw new Error("User not found");

          // 2) Set match limit based on plan price
          let limitCount = 2;
          if (fee === "14.99") limitCount = 3;
          if (fee === "29.99") limitCount = 4;

          // 3) Find top matches (same logic as matchUser)
          const topMatches = await findMatches(
            userId,
            updatedUser.compatibility || [],
            limitCount,
            session
          );

          if (!topMatches.length) {
            await session.commitTransaction();
            session.endSession();
            return res.status(200).send("No matches found");
          }

          let newParticipants = [
            {
              user: userId,
              score: 100,
              isQuestionAnswer: "",
            },
            ...topMatches.map((m) => ({
              user: m.user,
              score: m.score,
              isQuestionAnswer: "",
            })),
          ];

          // remove duplicates
          const seen = new Set();
          newParticipants = newParticipants.filter((p) => {
            if (seen.has(String(p.user))) return false;
            seen.add(String(p.user));
            return true;
          });

          // 4) Check existing podcast
          let podcast = await Podcast.findOne(
            { "participants.user": userId },
            {},
            { session }
          ) as any;

          if (podcast) {
            // Merge but respect limitCount
            const existingIds = new Set(podcast.participants.map((p: any) => String(p.user)));

            const additional = newParticipants.filter(
              (p) => !existingIds.has(String(p.user))
            );

            const merged = [
              ...podcast.participants,
              ...additional.slice(0, limitCount - podcast.participants.length),
            ];

            // unique again
            podcast.participants = Array.from(
              new Map(merged.map((p) => [String(p.user), p])).values()
            ).slice(0, limitCount);

            await podcast.save({ session });
          } else {
            // Create new podcast
            podcast = await Podcast.create(
              [
                {
                  primaryUser: userId,
                  participants: newParticipants.slice(0, limitCount),
                  status: "NotScheduled",
                },
              ],
              { session }
            );
          }

          // 5) Update isMatch flag
          const participantIds = podcast.participants.map((p: any) => p.user);

          await User.updateMany(
            { _id: { $in: participantIds } },
            { $set: { isMatch: true } },
            { session }
          );

          await session.commitTransaction();
          session.endSession();

          return res.status(200).send("Match processing completed");
        } catch (err) {
          await session.abortTransaction();
          session.endSession();
          console.error(err);
          throw err;
        }
      }

      case "invoice.payment_failed": {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const { userId, plan } = subscription.metadata;

        if (userId) {
          await User.findByIdAndUpdate(userId, {
            "subscription.status": SubscriptionStatus.FAILED,
          });

          await Notification.create({
            type: "payment_failed",
            user: userId,
            message: [
              {
                title: "Payment failed",
                description: `Your subscription payment for ${plan} did not go through.`,
              },
            ],
            read: false,
            section: "user",
          });
        }

        return res.status(200).send("Payment failed processed");
      }

      default:
        return res.status(200).send("Unhandled event");
    }
  } catch (err) {
    next(err);
  }
};

const StripeServices = {
  webhook,
};

export default StripeServices;
