import OpenAI from "openai";
import { UserSchema } from "@models/userModel";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const EMBEDDING_MODEL = "text-embedding-3-large"; // 1024 dimensions

/**
 * Embedding Strategy:
 * 
 * 1. Profile (Who the user is): Bio, interests, personality, background
 * 2. Preference (What the user wants): Desired gender, age range, body type
 * 3. Compatibility (Values and Lifestyle): Compatibility answers, survey responses
 */

export interface UserEmbeddingData {
  id: string; // userId:profile, userId:pref, userId:comp
  userId: string;
  type: 'profile' | 'pref' | 'comp';
  embedding: number[];
  metadata: {
    gender: string;
    age: number;
    bodyType: string;
    ethnicity: string[];
    latitude: number;
    longitude: number;
    isPodcastActive: boolean;
    name: string;
    type: 'profile' | 'pref' | 'comp';
  };
}

/**
 * Convert personality scores to descriptive text
 */
function personalityToText(personality: { spectrum: number; balance: number; focus: number }): string {
  const traits = [];

  // Spectrum: 1 (Introverted) → 7 (Extroverted)
  if (personality.spectrum <= 3) traits.push("introverted, prefers quiet settings");
  else if (personality.spectrum >= 5) traits.push("extroverted, enjoys social gatherings");
  else traits.push("balanced in social settings");

  // Balance: 1 (Logical) → 7 (Emotional)
  if (personality.balance <= 3) traits.push("logical and analytical");
  else if (personality.balance >= 5) traits.push("emotionally expressive");
  else traits.push("balanced between logic and emotion");

  // Focus: 1 (Relaxed) → 7 (Goal-oriented)
  if (personality.focus <= 3) traits.push("relaxed and spontaneous");
  else if (personality.focus >= 5) traits.push("goal-oriented and structured");
  else traits.push("balanced approach to goals");

  return traits.join(", ");
}

/**
 * Calculate age from dateOfBirth
 */
function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Generate text for user's profile (Who they are)
 */
export function generateProfileText(user: UserSchema): string {
  const parts: string[] = [];
  if (user.bio) parts.push(`About me: ${user.bio}`);
  if (user.interests?.length) parts.push(`Interests: ${user.interests.join(", ")}`);
  if (user.personality) parts.push(`Personality: ${personalityToText(user.personality)}`);
  if (user.ethnicity?.length) parts.push(`Background background: ${user.ethnicity.join(", ")}`);
  if (user.gender) parts.push(`Gender: ${user.gender}`);
  return parts.join("\n\n");
}

/**
 * Generate text for user's preferences (What they want)
 */
export function generatePreferenceText(user: UserSchema): string {
  const parts: string[] = [];
  const pref = user.preferences;
  if (pref) {
    if (pref.gender?.length) parts.push(`I am looking for: ${pref.gender.join(", ")}`);
    if (pref.age?.min && pref.age?.max) parts.push(`Preferred age range: ${pref.age.min} to ${pref.age.max} years old`);
    if (pref.bodyType?.length) parts.push(`Preferred body types: ${pref.bodyType.join(", ")}`);
    if (pref.ethnicity?.length) parts.push(`Preferred ethnicities: ${pref.ethnicity.join(", ")}`);
  }
  return parts.join("\n\n") || "No specific preferences provided.";
}

/**
 * Generate text for compatibility (Values and Lifestyle)
 */
export function generateCompatibilityText(user: UserSchema): string {
  const parts: string[] = [];
  if (user.compatibility?.length) parts.push(`My values and lifestyle choices: ${user.compatibility.join(". ")}`);
  if (user.survey?.length) parts.push(`Additional lifestyle information: ${user.survey.join(". ")}`);
  return parts.join("\n\n") || "No compatibility information provided.";
}

/**
 * Helper to generate embedding from text
 */
async function getEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) return new Array(1024).fill(0); // Return empty vector if no text
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: 1024,
    });
    return response.data[0].embedding;
  } catch (error: any) {
    console.error("Error generating embedding:", error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate three embeddings for a single user
 */
export async function generateUserEmbeddingData(user: UserSchema): Promise<UserEmbeddingData[]> {
  const profileText = generateProfileText(user);
  const prefText = generatePreferenceText(user);
  const compText = generateCompatibilityText(user);

  const [profileEmbedding, prefEmbedding, compEmbedding] = await Promise.all([
    getEmbedding(profileText),
    getEmbedding(prefText),
    getEmbedding(compText),
  ]);

  const age = calculateAge(user.dateOfBirth);
  const userId = String(user._id);
  const baseMetadata = {
    userId,
    gender: user.gender || "",
    age,
    bodyType: user.bodyType || "",
    ethnicity: user.ethnicity || [],
    latitude: user.location?.latitude || 0,
    longitude: user.location?.longitude || 0,
    isPodcastActive: (user as any).isPodcastActive || false,
    name: user.name || "",
  };

  return [
    {
      id: `${userId}:profile`,
      userId,
      type: 'profile',
      embedding: profileEmbedding,
      metadata: { ...baseMetadata, type: 'profile' },
    },
    {
      id: `${userId}:pref`,
      userId,
      type: 'pref',
      embedding: prefEmbedding,
      metadata: { ...baseMetadata, type: 'pref' },
    },
    {
      id: `${userId}:comp`,
      userId,
      type: 'comp',
      embedding: compEmbedding,
      metadata: { ...baseMetadata, type: 'comp' },
    },
  ];
}

/**
 * Batch generate embeddings for multiple users
 */
export async function batchGenerateEmbeddings(users: UserSchema[]): Promise<UserEmbeddingData[]> {
  const results: UserEmbeddingData[] = [];
  const BATCH_SIZE = 5; // Reduced batch size as each user now takes 3 OpenAI calls

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (user) => {
        try {
          return await generateUserEmbeddingData(user);
        } catch (error) {
          console.error(`Failed to generate embedding for user ${user._id}:`, error);
          return null;
        }
      })
    );

    for (const triple of batchResults) {
      if (triple) results.push(...triple);
    }

    if (i + BATCH_SIZE < users.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

export default {
  generateUserEmbeddingData,
  generateProfileText,
  generatePreferenceText,
  generateCompatibilityText,
  batchGenerateEmbeddings,
};
