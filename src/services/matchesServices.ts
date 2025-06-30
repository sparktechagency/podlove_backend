import User, { UserSchema } from "@models/userModel";
import { Request, Response, NextFunction } from "express";
import { calculateAge } from "@utils/ageUtils";
import OpenAI from "openai";
import process from "node:process";
import { StatusCodes } from "http-status-codes";
import createError from "http-errors";
import { Types } from "mongoose";
import Podcast from "@models/podcastModel";
import { calculateDistance } from "@utils/calculateDistanceUtils";
// const pLimit = require('p-limit');
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const CONCURRENCY_LIMIT = 3;
const MODEL = "gpt-4o";
// Calculates haversine distance in kilometers
// export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
//   const R = 6371;
//   const rad = (x: number) => (x * Math.PI) / 180;
//   const dLat = rad(lat2 - lat1);
//   const dLon = rad(lon2 - lon1);
//   const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// }

// Uses OpenAI to compute a compatibility score (0-100)
// async function getCompatibilityScore(answersA: string[], answersB: string[]): Promise<number> {
//   const prompt = answersA.map((a, i) => `Q${i+1}: A:${a} vs B:${answersB[i]}`).join('\n');
//   const system = 'Return only a compatibility score (0-100).';
//   const resp = await openai.chat.completions.create({
//     model: MODEL,
//     temperature: 0.3,
//     max_tokens: 10,
//     messages: [
//       { role: 'system', content: system },
//       { role: 'user', content: prompt }
//     ]
//   });
//   const raw = resp.choices[0].message?.content?.trim() || '0';
//   const num = parseFloat(raw);
//   return isNaN(num) ? 0 : Math.min(100, Math.max(0, num));
// }

export interface Preferences {
  gender: string[];
  age: { min: number; max: number };
  bodyType: string[];
  ethnicity: string[];
  distance: number;
}

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

  console.log("User content for OpenAI:", userContent);

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

    console.log("Raw API response:", response);
    const rawOutput = response.choices[0].message!.content!.trim();
    console.log("Raw output from OpenAI:", rawOutput);
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



async function findMatches(userId: string, answers: string[], limitCount = 3): Promise<any> {
  // 1) Load user
  const user = await User.findById(userId).lean();
  if (!user) throw new Error("User not found");

  if (user.compatibility && user.compatibility.length === 22) {
    answers = user.compatibility;
  }

  // 2) Save own answers
  await User.findByIdAndUpdate(userId, { compatibility: answers }).exec();

  // 3) Build filter based on preferences
  const pref = user.preferences;
  const age = calculateAge(user.dateOfBirth);
  if(age < pref.age.min || age > pref.age.max) {
    throw createError(StatusCodes.BAD_REQUEST, "User's age does not match preferences");
  }

  let candidates = await User.find({
    gender: { $in: pref.gender },
    bodyType: { $in: pref.bodyType },
    ethnicity: { $in: pref.ethnicity }
  }).lean();

  console.log("Candidates found:", candidates);
  // 4) Distance filtering
  const nearby = candidates.filter(
    (c) =>
      calculateDistance(user.location.latitude, user.location.longitude, c.location.latitude, c.location.longitude) <=
      pref.distance
  );

  // console.log("Nearby candidates:", nearby);

  // 5) Compute scores with concurrency limit
  // const limit = pLimit(CONCURRENCY_LIMIT);
  const scored = await Promise.all(
    nearby.map(async (c) => ({
      user: c,
      score: await getCompatibilityScore(answers, c.compatibility || []),
    }))
  );

  console.log("Scored candidates:", scored);

  // 6) Sort & return top N
  return scored
    .map((item) => ({
      user: item.user._id,
      score: item.score === null ? 0 : item.score,
    }))
    .sort((a, b) => {
      const scoreA = a.score ?? -Infinity;
      const scoreB = b.score ?? -Infinity;
      return scoreB - scoreA;
    })
    .slice(0, limitCount);
}

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_KEY,
// });

// const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
//   const R = 6371;
//   const dLat = (lat2 - lat1) * (Math.PI / 180);
//   const dLon = (lon2 - lon1) * (Math.PI / 180);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// };

// const filterUsers = async (
//   userPreferences: UserPreferences,
//   latitude: number,
//   longitude: number
// ): Promise<UserSchema[]> => {
//   const query = {
//     age: {
//       $gte: userPreferences.age.min,
//       $lte: userPreferences.age.max,
//     },
//     gender: { $in: userPreferences.gender },
//     bodyType: { $in: userPreferences.bodyType },
//     ethnicity: { $in: userPreferences.ethnicity },
//   };

//   const filteredUsers = await User.find(query).exec();

//   return filteredUsers.filter((user) => {
//     const distance = calculateDistance(latitude, longitude, user.location.latitude, user.location.longitude);
//     return distance <= userPreferences.distance;
//   });
// };

// const matchByCompatibility = async()

// const match = async (user: UserSchema, matchCount: number = 2): Promise<Types.ObjectId[]> => {
//   const userOneAnswers = user.compatibility;

//   const filteredUserList = await filterUsers(
//     user.preferences,
//     user.location.latitude,
//     user.location.longitude
//   );

//   const scoredCandidates = [];
//   for (const candidate of filteredUserList) {
//     const userTwoAnswers = candidate.compatibility;
//     const score = (await getCompatibilityScore(userOneAnswers, userTwoAnswers)) ?? 0;
//     scoredCandidates.push({
//       user: candidate,
//       compatibilityScore: score
//     });
//   }
//   scoredCandidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
//   return scoredCandidates.slice(0, matchCount).map((item) => item.user._id as Types.ObjectId);
// };

const match = async (userId: string, matchCount: number = 3): Promise<string[]> => {
  const matchedUsers = await User.aggregate([
    { $match: { _id: { $ne: new Types.ObjectId(userId) } } },
    { $sample: { size: matchCount } },
    { $project: { _id: 1 } },
  ]);
  return matchedUsers.map((u: { _id: Types.ObjectId }) => u._id.toString());
};

interface MatchRequestBody {
  compatibility: string[];
  count?: number;
}

const matchUser = async (
  req: Request<{ id: string }, {}, MatchRequestBody>,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const userId = req.params.id;
    let { compatibility, count } = req.body;
    if (!Array.isArray(compatibility) || compatibility.length !== 22) {
      throw createError(StatusCodes.BAD_REQUEST, "answers must be an array of 22 strings");
    }

    const topMatches = await findMatches(userId, compatibility, count || 3);
    const podcast = await Podcast.create({ primaryUser: userId, participants: topMatches, status: "NotScheduled" });
    return res.status(StatusCodes.OK).json({ success: true, message: "Matched users successfully", data: podcast });
  } catch (err) {
    next(err);
  }
};

const MatchedServices = {
  match,
  matchUser,
};

export default MatchedServices;
