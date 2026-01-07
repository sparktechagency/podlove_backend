import { Pinecone } from "@pinecone-database/pinecone";
import { UserSchema } from "@models/userModel";
import { generateUser3PartEmbeddingData, generateEmbedding } from "./embeddingService";
import { calculateDistance } from "@utils/calculateDistanceUtils";
import matchingConfig from "@config/matchingConfig";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || "podlove-users";
const DIMENSION = 1024;

/**
 * Initialize or get Pinecone index
 */
export async function getIndex() {
  try {
    const index = pinecone.index(INDEX_NAME);
    return index;
  } catch (error) {
    console.error("❌ Error getting Pinecone index:", error);
    throw error;
  }
}

/**
 * Create Pinecone index
 */
export async function createIndex() {
  try {
    const existingIndexes = await pinecone.listIndexes();
    const indexExists = existingIndexes.indexes?.some((idx: any) => idx.name === INDEX_NAME);

    if (indexExists) {
      console.log(`ℹ️ Index ${INDEX_NAME} already exists`);
      return;
    }

    console.log(`🔨 Creating Pinecone index: ${INDEX_NAME} (dimension: ${DIMENSION})...`);
    await pinecone.createIndex({
      name: INDEX_NAME,
      dimension: DIMENSION,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    });

    console.log(`🚀 Index ${INDEX_NAME} created successfully`);
  } catch (error: any) {
    console.error(`❌ Error creating index: ${error.message}`);
    throw error;
  }
}

/**
 * Clear all vectors from the index
 */
export async function clearIndex() {
  try {
    const index = await getIndex();
    console.log(`🧹 Clearing all vectors from index: ${INDEX_NAME}...`);
    await index.deleteAll();
    console.log(`✅ Index ${INDEX_NAME} cleared successfully`);
  } catch (error: any) {
    console.error(`❌ Error clearing index: ${error.message}`);
    throw error;
  }
}

/**
 * Upsert 3-part vectors for a single user
 */
export async function upsertUserVector(user: UserSchema): Promise<void> {
  try {
    if (!user.isProfileComplete) {
      console.log(`⚠️ User ${user._id} profile incomplete, skipping Pinecone upsert.`);
      return;
    }

    console.log(`📤 Upserting 3-part vectors for user: ${user._id} (${user.name})`);
    const embeddingData = await generateUser3PartEmbeddingData(user);
    const index = await getIndex();

    await index.upsert([
      {
        id: `profile:${embeddingData.userId}`,
        values: embeddingData.parts.profile,
        metadata: { ...embeddingData.metadata, part: "profile" } as any,
      },
      {
        id: `pref:${embeddingData.userId}`,
        values: embeddingData.parts.preference,
        metadata: { ...embeddingData.metadata, part: "pref" } as any,
      },
      {
        id: `comp:${embeddingData.userId}`,
        values: embeddingData.parts.compatibility,
        metadata: { ...embeddingData.metadata, part: "comp" } as any,
      },
    ]);

    console.log(`✅ Pinecone: User ${embeddingData.userId} 3-part vectors upserted successfully`);
  } catch (error: any) {
    console.error(`❌ Error upserting user ${user._id}:`, error.message);
    throw error;
  }
}

/**
 * Batch upsert multiple users
 */
export async function batchUpsertUserVectors(users: UserSchema[]): Promise<void> {
  try {
    const index = await getIndex();
    const BATCH_SIZE = 20; // 20 users * 3 vectors = 60 vectors per batch

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      const vectors = await Promise.all(
        batch.map(async (user) => {
          try {
            if (!user.isProfileComplete) return null;
            const data = await generateUser3PartEmbeddingData(user);
            return [
              { id: `profile:${data.userId}`, values: data.parts.profile, metadata: { ...data.metadata, part: "profile" } },
              { id: `pref:${data.userId}`, values: data.parts.preference, metadata: { ...data.metadata, part: "pref" } },
              { id: `comp:${data.userId}`, values: data.parts.compatibility, metadata: { ...data.metadata, part: "comp" } },
            ];
          } catch (error) {
            console.error(`Failed to process user ${user._id}:`, error);
            return null;
          }
        })
      );

      const validVectors = vectors.filter((v): v is NonNullable<typeof v> => v !== null).flat();

      if (validVectors.length > 0) {
        await index.upsert(validVectors as any);
        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: Upserted ${validVectors.length} vectors`);
      }

      if (i + BATCH_SIZE < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error: any) {
    console.error("Error in batch upsert:", error.message);
    throw error;
  }
}

/**
 * Delete all 3 vectors for a user
 */
export async function deleteUserVector(userId: string): Promise<void> {
  try {
    const index = await getIndex();
    console.log(`🗑️ Deleting vectors for user: ${userId}...`);
    await index.deleteMany([
      `profile:${userId}`,
      `pref:${userId}`,
      `comp:${userId}`
    ]);
  } catch (error: any) {
    console.error(`❌ Error deleting user ${userId}:`, error.message);
    throw error;
  }
}

interface VectorSearchResult {
  userId: string;
  similarityScore: number;
  metadata: any;
}

/**
 * Search for similar users.
 * Performs bidirectional matching across Profile, Preference, and Compatibility.
 */
export async function searchSimilarUsers(options: {
  user: UserSchema;
  topK?: number;
  minSimilarityScore?: number;
}): Promise<VectorSearchResult[]> {
  const { user, topK = 10, minSimilarityScore = 0.5 } = options;
  const index = await getIndex();

  try {
    const profileText = require("./embeddingService").generateProfileText(user);
    const preferenceText = require("./embeddingService").generatePreferenceText(user);
    const compatibilityText = require("./embeddingService").generateCompatibilityText(user);

    const [profileEmb, prefEmb, compEmb] = await Promise.all([
      generateEmbedding(profileText),
      generateEmbedding(preferenceText),
      generateEmbedding(compatibilityText),
    ]);

    // 1. Who matches my preferences? (My Pref vs Others' Profile)
    // 2. Who am I looking for? (My Profile vs Others' Pref)
    // 3. Who is compatible with me? (My Comp vs Others' Comp)
    const [prefMatches, profileMatches, compMatches] = await Promise.all([
      index.query({ vector: prefEmb, topK: topK * 2, filter: { part: "profile" }, includeMetadata: true }),
      index.query({ vector: profileEmb, topK: topK * 2, filter: { part: "pref" }, includeMetadata: true }),
      index.query({ vector: compEmb, topK: topK * 2, filter: { part: "comp" }, includeMetadata: true }),
    ]);

    const userScores = new Map<string, { score: number; count: number; metadata: any }>();

    const processMatches = (matches: any[]) => {
      for (const match of matches) {
        const actualUserId = match.id.split(":")[1];
        if (actualUserId === String(user._id)) continue;
        if (match.score && match.score < minSimilarityScore) continue;

        const current = userScores.get(actualUserId) || { score: 0, count: 0, metadata: match.metadata };
        current.score += match.score || 0;
        current.count += 1;
        userScores.set(actualUserId, current);
      }
    };

    processMatches(prefMatches.matches);
    processMatches(profileMatches.matches);
    processMatches(compMatches.matches);

    const results: VectorSearchResult[] = Array.from(userScores.entries()).map(([userId, data]) => ({
      userId,
      similarityScore: data.score / data.count, // Average score
      metadata: { ...data.metadata, part: "profile" }, // Ensure metadata refers to profile
    }));

    return results
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, topK);
  } catch (error: any) {
    console.error("Error searching similar users:", error.message);
    throw error;
  }
}

export default {
  getIndex,
  createIndex,
  clearIndex,
  upsertUserVector,
  batchUpsertUserVectors,
  deleteUserVector,
  searchSimilarUsers,
};
