import { Pinecone } from "@pinecone-database/pinecone";
import { UserSchema } from "@models/userModel";
import { generateUserEmbeddingData, generateProfileText, generatePreferenceText, generateCompatibilityText, UserEmbeddingData } from "./embeddingService";
import { calculateDistance } from "@utils/calculateDistanceUtils";
import { ageToDOB } from "@utils/ageUtils";
import matchingConfig from "@config/matchingConfig";
import OpenAI from "openai";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const EMBEDDING_MODEL = "text-embedding-3-large";

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

    console.log(`🔨 Creating Pinecone index: ${INDEX_NAME}...`);
    await pinecone.createIndex({
      name: INDEX_NAME,
      dimension: DIMENSION,
      metric: "cosine",
      spec: {
        serverless: { cloud: "aws", region: "us-east-1" },
      },
    });
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
    console.log(`🗑️ Clearing all vectors from index: ${INDEX_NAME}...`);
    await index.deleteAll();
    console.log(`✅ Index ${INDEX_NAME} cleared successfully`);
  } catch (error: any) {
    console.error(`❌ Error clearing index: ${error.message}`);
    throw error;
  }
}

/**
 * Upsert 3-part user embeddings into Pinecone
 */
export async function upsertUserVector(user: UserSchema): Promise<void> {
  try {
    console.log(`📤 Preparing 3-part vector upsert for user: ${user._id}`);
    const embeddingData = await generateUserEmbeddingData(user);
    const index = await getIndex();

    const records = embeddingData.map(data => ({
      id: data.id,
      values: data.embedding,
      metadata: data.metadata as any,
    }));

    await index.upsert(records);
    console.log(`✅ Pinecone: User ${user._id} (3 vectors) upserted successfully`);
  } catch (error: any) {
    console.error(`❌ Error upserting user ${user._id}:`, error.message);
    throw error;
  }
}

/**
 * Batch upsert multiple users
 */
export async function batchUpsertUserVectors(users: UserSchema[]): Promise<void> {
  const index = await getIndex();
  const BATCH_SIZE = 20; // 20 users * 3 vectors = 60 records per batch

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const allRecords: any[] = [];

    await Promise.all(batch.map(async (user) => {
      try {
        const embeddingData = await generateUserEmbeddingData(user);
        allRecords.push(...embeddingData.map(data => ({
          id: data.id,
          values: data.embedding,
          metadata: data.metadata as any,
        })));
      } catch (error) {
        console.error(`Failed to generate embeddings for user ${user._id}:`, error);
      }
    }));

    if (allRecords.length > 0) {
      await index.upsert(allRecords);
      console.log(`Batch ${i / BATCH_SIZE + 1}: Upserted ${allRecords.length} records`);
    }

    if (i + BATCH_SIZE < users.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

/**
 * Delete a user's 3 vectors from Pinecone
 */
export async function deleteUserVector(userId: string): Promise<void> {
  try {
    const index = await getIndex();
    const idsToDelete = [`${userId}:profile`, `${userId}:pref`, `${userId}:comp`];
    console.log(`🗑️ Deleting vectors for user: ${userId}...`);
    await index.deleteMany(idsToDelete);
  } catch (error: any) {
    console.error(`❌ Error deleting user ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Helper to get embedding from text
 */
async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text || " ",
    dimensions: 1024,
  });
  return response.data[0].embedding;
}

/**
 * Search for similar users using bidirectional 3-part logic
 */
export async function searchSimilarUsers(options: {
  user: UserSchema,
  topK?: number,
  minSimilarityScore?: number
}) {
  const { user, topK = 20, minSimilarityScore = 0.5 } = options;
  const index = await getIndex();
  const userId = String(user._id);

  try {
    // 1. Generate embeddings for the current user's 3 parts
    const [profileEmb, prefEmb, compEmb] = await Promise.all([
      getEmbedding(generateProfileText(user)),
      getEmbedding(generatePreferenceText(user)),
      getEmbedding(generateCompatibilityText(user)),
    ]);

    // Build common filters
    const filter: any = { isPodcastActive: false };
    const pref = user.preferences;

    if (matchingConfig.ENABLE_PREFERENCE_FILTERS) {
      if (pref.gender?.length) filter.gender = { $in: pref.gender };
      if (pref.age?.min && pref.age?.max) {
        filter.age = { $gte: pref.age.min, $lte: pref.age.max };
      }
    }

    // 2. Perform 3 types of searches
    const [matchesForMyProfile, matchesForMyPref, matchesForMyComp] = await Promise.all([
      // Search: Who wants someone like me? (My Profile vs others' Pref)
      index.query({ vector: profileEmb, topK: topK * 2, filter: { ...filter, type: 'pref' }, includeMetadata: true }),
      // Search: Who matches what I want? (My Pref vs others' Profile)
      index.query({ vector: prefEmb, topK: topK * 2, filter: { ...filter, type: 'profile' }, includeMetadata: true }),
      // Search: Who is compatible with me? (My Comp vs others' Comp)
      index.query({ vector: compEmb, topK: topK * 2, filter: { ...filter, type: 'comp' }, includeMetadata: true }),
    ]);

    // 3. Aggregate scores by userId
    const userScores: Record<string, { total: number, counts: number, metadata: any }> = {};

    const processMatches = (matches: any[], partType: string) => {
      for (const match of matches) {
        // Use the userId from metadata if available, otherwise fallback to parsing ID
        const uId = match.metadata?.userId || match.id.split(":")[0];
        if (uId === userId) continue;
        if (match.score < minSimilarityScore) continue;

        if (!userScores[uId]) {
          userScores[uId] = { total: 0, counts: 0, metadata: match.metadata };
        }
        userScores[uId].total += match.score;
        userScores[uId].counts += 1;

        // Ensure we keep the 'profile' metadata if we encounter it
        if (partType === 'profile') {
          userScores[uId].metadata = match.metadata;
        }
      }
    };

    processMatches(matchesForMyProfile.matches, 'pref');
    processMatches(matchesForMyPref.matches, 'profile');
    processMatches(matchesForMyComp.matches, 'comp');

    // 4. Calculate average scores and return
    const results = Object.entries(userScores).map(([uId, data]) => ({
      userId: uId,
      similarityScore: data.total / data.counts, // Use actual match count for average
      metadata: { ...data.metadata, type: 'profile' }, // Always present as a profile match
    }));

    // Distance filtering
    const filteredResults = results.filter(res => {
      if (matchingConfig.PREFERENCE_FILTERS.DISTANCE && res.metadata.latitude && res.metadata.longitude) {
        const dist = calculateDistance(
          user.location.latitude,
          user.location.longitude,
          res.metadata.latitude,
          res.metadata.longitude
        );
        return dist <= (user.preferences.distance || matchingConfig.DEFAULT_MAX_DISTANCE);
      }
      return true;
    });

    return filteredResults.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, topK);
  } catch (error: any) {
    console.error("Error in searchSimilarUsers:", error.message);
    throw error;
  }
}

/**
 * Stats helper
 */
export async function getIndexStats() {
  const index = await getIndex();
  return await index.describeIndexStats();
}

export default {
  getIndex,
  createIndex,
  clearIndex,
  upsertUserVector,
  batchUpsertUserVectors,
  deleteUserVector,
  searchSimilarUsers,
  getIndexStats,
};
