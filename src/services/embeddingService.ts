import OpenAI from "openai";
import { UserSchema } from "@models/userModel";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const EMBEDDING_MODEL = "text-embedding-3-large"; // 1024 dimensions

/**
 * Split embeddings for bidirectional matching:
 * 1. Profile: Who the user is
 * 2. Preference: What the user is looking for
 * 3. Compatibility: Values and lifestyle
 */

export interface User3PartEmbeddingData {
  userId: string;
  parts: {
    profile: number[];
    preference: number[];
    compatibility: number[];
  };
  metadata: {
    gender: string;
    age: number;
    bodyType: string;
    ethnicity: string[];
    latitude: number;
    longitude: number;
    isPodcastActive: boolean;
    name: string;
    isProfileComplete: boolean;
  };
}

/**
 * Convert personality scores to descriptive text
 */
function personalityToText(personality: { spectrum: number; balance: number; focus: number }): string {
  const traits = [];

  if (personality.spectrum <= 3) traits.push("introverted, prefers quiet settings");
  else if (personality.spectrum >= 5) traits.push("extroverted, enjoys social gatherings");
  else traits.push("balanced in social settings");

  if (personality.balance <= 3) traits.push("logical and analytical");
  else if (personality.balance >= 5) traits.push("emotionally expressive");
  else traits.push("balanced between logic and emotion");

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
 * 1. Profile Text: Focus on the user's attributes
 */
export function generateProfileText(user: UserSchema): string {
  const parts: string[] = [];
  parts.push(`Name: ${user.name}`);
  if (user.bio) parts.push(`Bio: ${user.bio}`);
  if (user.interests?.length) parts.push(`Interests: ${user.interests.join(", ")}`);
  if (user.personality) parts.push(`Personality: ${personalityToText(user.personality)}`);
  if (user.ethnicity?.length) parts.push(`Background/Ethnicity: ${user.ethnicity.join(", ")}`);
  parts.push(`Gender: ${user.gender}`);
  return parts.join("\n");
}

/**
 * 2. Preference Text: Focus on what the user wants
 */
export function generatePreferenceText(user: UserSchema): string {
  const parts: string[] = [];
  const pref = user.preferences;
  if (!pref) return "No preferences specified.";

  if (pref.gender?.length) parts.push(`Interested in: ${pref.gender.join(", ")}`);
  if (pref.age?.min && pref.age?.max) parts.push(`Preferred age range: ${pref.age.min} to ${pref.age.max} years old`);
  if (pref.bodyType?.length) parts.push(`Preferred body types: ${pref.bodyType.join(", ")}`);
  if (pref.ethnicity?.length) parts.push(`Preferred ethnic background: ${pref.ethnicity.join(", ")}`);
  if (pref.distance) parts.push(`Willing to meet within ${pref.distance} miles`);

  return parts.join("\n");
}

/**
 * 3. Compatibility Text: Focus on values and lifestyle
 */
export function generateCompatibilityText(user: UserSchema): string {
  const parts: string[] = [];
  if (user.compatibility?.length) parts.push(`Relationship values and lifestyle: ${user.compatibility.join(". ")}`);
  if (user.survey?.length) parts.push(`Additional lifestyle information: ${user.survey.join(". ")}`);
  return parts.join("\n") || "No compatibility data provided.";
}

/**
 * Generate embedding vector for a given text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) {
    // Return a zero vector or handle appropriately. 
    // Pinecone requires vectors to be present, so we usually either skip or provide a dummy if text is empty.
    // For our case, we'll return a dummy vector if text is empty to avoid crashing, but ideally we skip upsert.
    return new Array(1024).fill(0);
  }

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
 * Generate 3-part embedding data for Pinecone
 */
export async function generateUser3PartEmbeddingData(user: UserSchema): Promise<User3PartEmbeddingData> {
  const profileText = generateProfileText(user);
  const preferenceText = generatePreferenceText(user);
  const compatibilityText = generateCompatibilityText(user);

  const [profile, preference, compatibility] = await Promise.all([
    generateEmbedding(profileText),
    generateEmbedding(preferenceText),
    generateEmbedding(compatibilityText),
  ]);

  const age = user.dateOfBirth ? calculateAge(user.dateOfBirth) : 0;

  return {
    userId: String(user._id),
    parts: {
      profile,
      preference,
      compatibility,
    },
    metadata: {
      gender: user.gender || "",
      age,
      bodyType: user.bodyType || "",
      ethnicity: user.ethnicity || [],
      latitude: user.location?.latitude || 0,
      longitude: user.location?.longitude || 0,
      isPodcastActive: (user as any).isPodcastActive || false,
      name: user.name || "",
      isProfileComplete: user.isProfileComplete || false,
    },
  };
}

/**
 * Batch generate 3-part embeddings
 */
export async function batchGenerate3PartEmbeddings(users: UserSchema[]): Promise<User3PartEmbeddingData[]> {
  const results: User3PartEmbeddingData[] = [];
  const BATCH_SIZE = 5; // Reduced batch size since we do 3 calls per user

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (user) => {
        try {
          return await generateUser3PartEmbeddingData(user);
        } catch (error) {
          console.error(`Failed to generate 3-part embedding for user ${user._id}:`, error);
          return null;
        }
      })
    );

    results.push(...batchResults.filter((r): r is User3PartEmbeddingData => r !== null));

    if (i + BATCH_SIZE < users.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

export default {
  generateProfileText,
  generatePreferenceText,
  generateCompatibilityText,
  generateEmbedding,
  generateUser3PartEmbeddingData,
  batchGenerate3PartEmbeddings,
};
