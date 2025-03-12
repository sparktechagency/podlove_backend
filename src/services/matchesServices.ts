import User, { UserSchema } from "@models/userModel";
import OpenAI from "openai";
import process from "node:process";
import { Types } from "mongoose";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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
      model: "gpt-4o",
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
type UserPreferences = {
  gender: string[];
  age: { min: number; max: number };
  bodyType: string[];
  ethnicity: string[];
  distance: number;
};
const filterUsers = async (
  userPreferences: UserPreferences,
  latitude: number,
  longitude: number
): Promise<UserSchema[]> => {
  const query = {
    age: {
      $gte: userPreferences.age.min,
      $lte: userPreferences.age.max,
    },
    gender: { $in: userPreferences.gender },
    bodyType: { $in: userPreferences.bodyType },
    ethnicity: { $in: userPreferences.ethnicity },
  };

  const filteredUsers = await User.find(query).exec();

  return filteredUsers.filter((user) => {
    const distance = calculateDistance(latitude, longitude, user.location.latitude, user.location.longitude);
    return distance <= userPreferences.distance;
  });
};

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

const match = async (userId: string, matchCount: number = 2): Promise<string[]> => {
  const matchedUsers = await User.aggregate([
    { $match: { _id: { $ne: new Types.ObjectId(userId) } } },
    { $sample: { size: matchCount } },
    { $project: { _id: 1 } },
  ]);
  return matchedUsers.map((u: { _id: Types.ObjectId }) => u._id.toString());
};

const MatchedServices = {
  match,
};

export default MatchedServices;
