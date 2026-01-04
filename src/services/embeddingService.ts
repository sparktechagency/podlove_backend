import OpenAI from "openai";
import { UserSchema } from "@models/userModel";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const EMBEDDING_MODEL = "text-embedding-3-large"; // 1024 dimensions

/**
 * Multi-Vector Strategy:
 * 
 * Each user has 3 distinct vectors in Pinecone:
 * 1. PROFILE: What the user IS (Bio, Interests, Personality)
 * 2. PREFS: What the user WANTS (Survey, Preferences as text)
 * 3. COMP: Relationship values (Compatibility answers)
 * 
 * IDs in Pinecone:
 * - {userId}#profile
 * - {userId}#prefs
 * - {userId}#comp
 */

export enum VectorType {
  PROFILE = "profile",
  PREFS = "prefs",
  COMP = "comp",
}

interface UserVectorMetadata {
  userId: string;
  type: VectorType;
  gender: string;
  age: number;
  bodyType: string;
  ethnicity: string[];
  latitude: number;
  longitude: number;
  isPodcastActive: boolean;
  name: string;
}

interface UserEmbeddingData {
  id: string; // userId#type
  embedding: number[];
  metadata: UserVectorMetadata;
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
function calculateAge(dateOfBirth: string | null | undefined): number {
  if (!dateOfBirth) return 0;
  try {
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return 0;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return isNaN(age) ? 0 : age;
  } catch (e) {
    return 0;
  }
}

/**
 * Generate text for the PROFILE vector (Who I am)
 */
export function generateProfileText(user: UserSchema): string {
  const parts: string[] = [];
  if (user.bio) parts.push(`About me: ${user.bio}`);
  if (user.interests?.length) parts.push(`My interests: ${user.interests.join(", ")}`);
  if (user.personality) parts.push(`My personality traits: ${personalityToText(user.personality)}`);
  if (user.ethnicity?.length) parts.push(`My background: ${user.ethnicity.join(", ")}`);
  return parts.join("\n\n");
}

/**
 * Generate text for the PREFS vector (What I want)
 */
export function generatePrefsText(user: UserSchema): string {
  const parts: string[] = [];
  if (user.survey?.length) parts.push(`What I look for in a partner: ${user.survey.join(". ")}`);

  const prefs = user.preferences;
  if (prefs) {
    const prefParts = [];
    if (prefs.gender?.length) prefParts.push(`seeking ${prefs.gender.join(" or ")}`);
    if (prefs.age?.min && prefs.age?.max) prefParts.push(`aged ${prefs.age.min} to ${prefs.age.max}`);
    if (prefs.bodyType?.length) prefParts.push(`with body type ${prefs.bodyType.join(", ")}`);
    if (prefParts.length) parts.push(`Preferences detail: I am ${prefParts.join(", ")}.`);
  }

  return parts.join("\n\n");
}

/**
 * Generate text for the COMP vector (Compatibility questions)
 */
export function generateCompText(user: UserSchema): string {
  if (user.compatibility?.length) {
    return `My relationship values and lifestyle choices: ${user.compatibility.join(". ")}`;
  }
  return "";
}

/**
 * Generate embedding vector for a given text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) {
    return new Array(1024).fill(0); // Return empty vector if no text
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
 * Generate complete multi-vector embedding data for Pinecone storage
 */
export async function generateUserEmbeddingData(user: UserSchema): Promise<UserEmbeddingData[]> {
  const age = calculateAge(user.dateOfBirth);
  const userId = String(user._id);

  const commonMetadata: Omit<UserVectorMetadata, "type"> = {
    userId,
    gender: user.gender || "unspecified",
    age: age || 0,
    bodyType: user.bodyType || "unspecified",
    ethnicity: Array.isArray(user.ethnicity) ? user.ethnicity.filter(Boolean) : [],
    latitude: user.location?.latitude || 0,
    longitude: user.location?.longitude || 0,
    isPodcastActive: (user as any).isPodcastActive || false,
    name: user.name || "Anonymous",
  };

  const tasks = [
    { type: VectorType.PROFILE, text: generateProfileText(user) },
    { type: VectorType.PREFS, text: generatePrefsText(user) },
    { type: VectorType.COMP, text: generateCompText(user) },
  ];

  const results: UserEmbeddingData[] = [];

  for (const task of tasks) {
    if (task.text.trim()) {
      const embedding = await generateEmbedding(task.text);
      results.push({
        id: `${userId}#${task.type}`,
        embedding,
        metadata: {
          ...commonMetadata,
          type: task.type,
        },
      });
    }
  }

  return results;
}

/**
 * Batch generate embeddings for multiple users
 */
export async function batchGenerateEmbeddings(users: UserSchema[]): Promise<UserEmbeddingData[]> {
  const allVectors: UserEmbeddingData[] = [];

  // Process in small batches
  const BATCH_SIZE = 5;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const userBatch = users.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      userBatch.map(async (user) => {
        try {
          return await generateUserEmbeddingData(user);
        } catch (error) {
          console.error(`Failed to generate embeddings for user ${user._id}:`, error);
          return [];
        }
      })
    );

    for (const userVectors of batchResults) {
      allVectors.push(...userVectors);
    }

    if (i + BATCH_SIZE < users.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return allVectors;
}

export default {
  generateUserEmbeddingData,
  generateEmbedding,
  generateProfileText,
  generatePrefsText,
  generateCompText,
  batchGenerateEmbeddings,
  VectorType,
};
