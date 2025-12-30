import OpenAI from "openai";
import { UserSchema } from "@models/userModel";

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const EMBEDDING_MODEL = "text-embedding-3-large"; // 1024 dimensions

/**
 * Embedding Strategy:
 * 
 * Fields to Embed (semantic search):
 * - Bio (user's self-description)
 * - Interests (hobbies, activities)
 * - Compatibility answers (relationship values, lifestyle choices)
 * - Personality traits (converted to descriptive text)
 * - Survey responses
 * 
 * Fields to Keep as Metadata (exact filtering):
 * - Gender
 * - Age (dateOfBirth converted to age)
 * - BodyType
 * - Ethnicity
 * - Location (lat/long for distance filtering)
 * - isPodcastActive (exclude already matched users)
 */

interface UserEmbeddingData {
  userId: string;
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
 * Generate a rich text representation of a user profile for embedding
 */
export function generateProfileText(user: UserSchema): string {
  const parts: string[] = [];

  // Bio
  if (user.bio) {
    parts.push(`About me: ${user.bio}`);
  }

  // Interests
  if (user.interests?.length) {
    parts.push(`Interests: ${user.interests.join(", ")}`);
  }

  // Personality
  if (user.personality) {
    parts.push(`Personality: ${personalityToText(user.personality)}`);
  }

  // Compatibility answers (relationship values)
  if (user.compatibility?.length) {
    parts.push(`Relationship values and lifestyle: ${user.compatibility.join(". ")}`);
  }

  // Survey responses
  if (user.survey?.length) {
    parts.push(`Additional preferences: ${user.survey.join(". ")}`);
  }

  // Ethnicity (as context, not filter)
  if (user.ethnicity?.length) {
    parts.push(`Background: ${user.ethnicity.join(", ")}`);
  }

  return parts.join("\n\n");
}

/**
 * Generate embedding vector for a user profile
 */
export async function generateUserEmbedding(user: UserSchema): Promise<number[]> {
  const profileText = generateProfileText(user);
  
  if (!profileText.trim()) {
    throw new Error("Cannot generate embedding: user profile is empty");
  }

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: profileText,
      dimensions: 1024,
    });

    return response.data[0].embedding;
  } catch (error: any) {
    console.error("Error generating embedding:", error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate complete embedding data for Pinecone storage
 */
export async function generateUserEmbeddingData(user: UserSchema): Promise<UserEmbeddingData> {
  const embedding = await generateUserEmbedding(user);
  const age = user.dateOfBirth ? calculateAge(user.dateOfBirth) : 0;

  return {
    userId: String(user._id),
    embedding,
    metadata: {
      gender: user.gender || "",
      age,
      bodyType: user.bodyType || "",
      ethnicity: user.ethnicity || [],
      latitude: user.location?.latitude || 0,
      longitude: user.location?.longitude || 0,
      isPodcastActive: (user as any).isPodcastActive || false,
      name: user.name || "",
    },
  };
}

/**
 * Batch generate embeddings for multiple users
 * Useful for initial migration or bulk updates
 */
export async function batchGenerateEmbeddings(users: UserSchema[]): Promise<UserEmbeddingData[]> {
  const results: UserEmbeddingData[] = [];
  
  // Process in batches to avoid rate limits
  const BATCH_SIZE = 10;
  
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
    
    results.push(...batchResults.filter((r): r is UserEmbeddingData => r !== null));
    
    // Add delay between batches to respect rate limits
    if (i + BATCH_SIZE < users.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

export default {
  generateUserEmbedding,
  generateUserEmbeddingData,
  generateProfileText,
  batchGenerateEmbeddings,
};
