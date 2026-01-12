import Stripe from "stripe";
import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { SubscriptionPlanName, SubscriptionStatus } from "@shared/enums";
import { StatusCodes } from "http-status-codes";
import User from "@models/userModel";
import mongoose, { Types } from "mongoose";
import Notification from "@models/notificationModel";
import { ageToDOB } from "@utils/ageUtils";
import { calculateDistance } from "@utils/calculateDistanceUtils";
import Podcast from "@models/podcastModel";
import OpenAI from "openai";
import { upsertUserVector } from "./vectorService";
import { createAndUpdatePodcast, findMatchesWithVectors } from "./matchesServices";

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const MODEL = "gpt-4o";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/* ---------------- Compatibility Score ---------------- */
// const getCompatibilityScore = async (
//   userOneAnswers: string[],
//   userTwoAnswers: string[]
// ): Promise<number | null> => {
//   if (!userOneAnswers.length || !userTwoAnswers.length) return 0;

//   const questions = [
//     "Do you prefer spending your weekends socializing in larger gatherings or relaxing at home with a few close friends?",
//     "When faced with a major life decision, do you usually follow your head (logic) or your heart (feelings)?",
//     "Which of these activities sounds most appealing to you?",
//     "How important is personal growth in your life?",
//     "How do you like to show affection?",
//     "How do you envision your ideal future?",
//     "Do you have kids?",
//     "Do you want kids in the future?",
//     "Will you date a person who has kids?",
//     "Do you smoke?",
//     "Will you date a smoker?",
//     "How would you describe your drinking habits?",
//     "Do you consider yourself religious or spiritual?",
//     "How important is religion/spirituality in your life?",
//     "Would you date someone with different religious or spiritual beliefs?",
//     "How would you describe your level of political engagement?",
//     "Would you date someone with different political beliefs?",
//     "Do you have pets?",
//     "If yes, which pet do you have?",
//     "How important is spontaneity to you in a relationship?",
//     "How would you describe your communication style?",
//     "How do you recharge after a busy day?",
//     "What kind of vacation do you enjoy most?",
//     "Do you enjoy trying new hobbies or sticking to the ones you know and love?",
//     "When it comes to resolving conflicts, do you prefer to address them right away or take time to reflect?",
//     "How do you feel about sharing responsibilities in a relationship?",
//     "What role does family play in your life?",
//     "How important is it for your partner to share your core values and beliefs?",
//     "When it comes to emotional expression, are you more open or reserved?",
//     "In a relationship, what is more important: emotional, intellectual, shared interests, or physical chemistry?",
//     "How do you handle stress or challenges in life?",
//     "What is your approach to financial planning in a relationship?",
//     "How do you feel about taking risks in life?",
//     "How important is maintaining a healthy lifestyle?",
//     "How do you feel about pets in a relationship?",
//     "How do you prefer your partner to handle disagreements?",
//     "How do you feel about physical intimacy early in a relationship?",
//     "How do you handle showing love and affection in public?",
//     "Are you more of a morning person or a night owl?",
//     "How organized and tidy do you like your living space to be?"
//   ];


//   let userContent = "Below are 40 questions, followed by each user's responses.\n";
//   userContent += "Please produce a single numeric compatibility score between 0 and 100.\n\n";

//   for (let i = 0; i < questions.length; i++) {
//     userContent += `Question ${i + 1}: ${questions[i]}\n`;
//     userContent += `User1: ${userOneAnswers[i] || ""}\n`;
//     userContent += `User2: ${userTwoAnswers[i] || ""}\n\n`;
//   }

//   try {
//     const response = await openai.chat.completions.create({
//       model: MODEL,
//       temperature: 0.3,
//       max_tokens: 50,
//       messages: [
//         { role: "system", content: "You are a dating compatibility algorithm. Output ONLY a number (0-100)." },
//         { role: "user", content: userContent },
//       ],
//     });

//     const raw = response.choices[0].message?.content?.trim() || "";
//     if (!/^\d+(\.\d+)?$/.test(raw)) throw new Error("Invalid score");
//     return parseFloat(raw);
//   } catch (err) {
//     console.error("OpenAI error:", err);
//     return 0;
//   }
// };

/* ---------------- Match Finder ---------------- */
// async function findMatches(
//   userId: string,
//   answers: string[],
//   limitCount: number,
//   session?: mongoose.ClientSession
// ): Promise<any[]> {
//   const user = await User.findById(userId, {}, session ? { session } : {});
//   if (!user) throw new Error("User not found");

//   answers = answers?.length ? answers : user.compatibility || [];
//   if (!answers.length) return [];

//   await User.findByIdAndUpdate(userId, { compatibility: answers }, session ? { session } : {});

//   const pref = user.preferences;

//   let candidates = await User.find(
//     {
//       _id: { $ne: user._id },
//       dateOfBirth: { $gte: ageToDOB(pref.age.max), $lte: ageToDOB(pref.age.min) },
//       gender: { $in: pref.gender },
//       bodyType: { $in: pref.bodyType },
//       ethnicity: { $in: pref.ethnicity },
//       isPodcastActive: false,
//       "location.latitude": { $exists: true },
//       "location.longitude": { $exists: true },
//     },
//     null,
//     session ? { session } : {}
//   ).lean();

//   candidates = candidates.filter((c) => {
//     const dist = calculateDistance(
//       user.location.latitude,
//       user.location.longitude,
//       c.location.latitude,
//       c.location.longitude
//     );
//     return dist <= pref.distance;
//   });

//   // Limit OpenAI scoring to top 5 candidates to avoid timeout
//   const limitedCandidates = candidates.slice(0, 5);

//   const scored = await Promise.all(
//     limitedCandidates.map(async (c) => ({
//       user: c,
//       score: await getCompatibilityScore(answers, c.compatibility || []),
//     }))
//   );

//   return scored
//     .map((item) => ({
//       user: item.user._id,
//       score: item.score ?? 0, // <- make sure score is never null
//     }))
//     .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)) // <- coerce null to 0
//     .slice(0, limitCount);
// }


/* ---------------- STRIPE WEBHOOK ---------------- */
const webhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const sig = req.headers["stripe-signature"] as string | undefined;

  if (!sig) {
    next(createError(StatusCodes.FORBIDDEN, "Missing Stripe signature"));
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const { userId, plan, fee, subscription_id } = subscription.metadata;
          if (!userId || !Types.ObjectId.isValid(userId)) throw new Error("Invalid user ID");

          let isSpotlight: number;
          let matchCount: number;
          // let matchRefresh: number;
          switch (plan) {
            case SubscriptionPlanName.SEEKER:
              isSpotlight = 2;
              // matchRefresh = 1;
              matchCount = 3;
              break;
            case SubscriptionPlanName.SCOUT:
              isSpotlight = 3;
              // matchRefresh = 2;
              matchCount = 4;
              break;
            default:
              isSpotlight = 1;
              // matchRefresh = 2;
              matchCount = 0;
          }

          const updatedUser = await User.findById(userId);
          // console.log(`0 =============Updated subscription for user ${userId}:`, updatedUser?.subscription);
          if (!updatedUser) throw new Error("User not found");
          updatedUser.subscription.id = subscription.id;
          // @ts-check
          updatedUser.subscription.subscription_id = new Types.ObjectId(subscription_id);
          updatedUser.subscription.plan = plan as SubscriptionPlanName;
          updatedUser.subscription.fee = String(fee);
          updatedUser.subscription.startedAt = new Date();
          updatedUser.subscription.status = SubscriptionStatus.PAID;
          updatedUser.subscription.isSpotlight = isSpotlight;
          // updatedUser.subscription.matchRefresh = matchRefresh;
          updatedUser.subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await updatedUser.save();

          console.log(`Updated User Subscription:`, updatedUser);
          if (!updatedUser) {
            throw new Error("User not found or update failed");
          }

          // Upsert user vector to Pinecone (async, non-blocking)
          if (updatedUser.isProfileComplete) {
            upsertUserVector(updatedUser).catch((err) => {
              console.error("Failed to upsert user vector during subscription:", err);
            });
          }
          // Matching logic is handled separately by the findMatch endpoint
          // User will call the match API after subscribing
          const participants = await findMatchesWithVectors(
            userId,
            updatedUser.compatibility,
            matchCount,
            session
          );
          if (participants.length !== matchCount) {
            throw new Error("Match count mismatch");
          }

          if (participants.length !== matchCount) {
            throw new Error("Match count mismatch");
          }

          const userUpdate = await createAndUpdatePodcast({
            isSpotlight: updatedUser.subscription.isSpotlight,
            userId: updatedUser._id,
            newParticipants: participants,
            session
          });

          if (userUpdate) {
            await User.findByIdAndUpdate(
              userId,
              {
                $inc: {
                  "subscription.isSpotlight": -1,
                },
              },
              { new: true, session }
            );
          }



          await session.commitTransaction();
          session.endSession();
          res.status(200).send("Subscription activated successfully");
          return;
        } catch (err) {
          await session.abortTransaction();
          session.endSession();
          console.error("Webhook error:", err);
          next(err);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const { userId, plan } = subscription.metadata;

        if (userId) {
          await User.findByIdAndUpdate(userId, { "subscription.status": SubscriptionStatus.FAILED });
          await Notification.create({
            type: "payment_failed",
            user: userId,
            message: [{ title: "Payment failed", description: `Your ${plan} subscription payment failed.` }],
            read: false,
            section: "user",
          });
        }

        res.status(200).send("Payment failure processed");
        return;
      }

      default:
        res.status(200).send("Event ignored");
        return;
    }
  } catch (err) {
    next(err);
  }
};

export default { webhook };
