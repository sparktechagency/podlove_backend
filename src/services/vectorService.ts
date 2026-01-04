import { Pinecone } from "@pinecone-database/pinecone";
import { UserSchema } from "@models/userModel";
import {
  generateUserEmbeddingData,
  generateEmbedding,
  VectorType,
  generateProfileText,
  generatePrefsText,
  generateCompText
} from "./embeddingService";
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
 * Upsert a user's multi-vectors into Pinecone
 */
export async function upsertUserVector(user: UserSchema): Promise<void> {
  try {
    console.log(`📤 Preparing vector upsert for user: ${user._id} (${user.name})`);
    const vectors = await generateUserEmbeddingData(user);
    const index = await getIndex();

    await index.upsert(
      vectors.map((v) => ({
        id: v.id,
        values: v.embedding,
        metadata: v.metadata as any,
      }))
    );

    console.log(`✅ Pinecone: User ${user._id} vectors (${vectors.length}) upserted successfully`);
  } catch (error: any) {
    console.error(`❌ Error upserting user ${user._id}:`, error.message);
    throw error;
  }
}

/**
 * Batch upsert multiple user vectors
 */
export async function batchUpsertUserVectors(users: UserSchema[]): Promise<void> {
  try {
    const index = await getIndex();
    const BATCH_SIZE = 50;

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      const allVectors = await Promise.all(
        batch.map(async (user) => {
          try {
            return await generateUserEmbeddingData(user);
          } catch (error) {
            console.error(`Failed to process user ${user._id}:`, error);
            return [];
          }
        })
      );

      const flatVectors = allVectors.flat().map((v) => ({
        id: v.id,
        values: v.embedding,
        metadata: v.metadata as any,
      }));

      if (flatVectors.length > 0) {
        await index.upsert(flatVectors);
        console.log(`Batch ${i / BATCH_SIZE + 1}: Upserted ${flatVectors.length} vectors`);
      }

      if (i + BATCH_SIZE < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Successfully upserted vectors for ${users.length} users`);
  } catch (error: any) {
    console.error("Error in batch upsert:", error.message);
    throw error;
  }
}

/**
 * Delete a user's vectors from Pinecone
 */
export async function deleteUserVector(userId: string): Promise<void> {
  try {
    const index = await getIndex();
    console.log(`🗑️ Deleting vectors for user: ${userId}...`);
    // Delete all 3 types
    await index.deleteMany([
      `${userId}#${VectorType.PROFILE}`,
      `${userId}#${VectorType.PREFS}`,
      `${userId}#${VectorType.COMP}`,
    ]);
    console.log(`✅ User ${userId} vectors deleted successfully from Pinecone`);
  } catch (error: any) {
    console.error(`❌ Error deleting user ${userId}:`, error.message);
    throw error;
  }
}

interface VectorSearchOptions {
  user: UserSchema;
  topK?: number;
  minSimilarityScore?: number;
}

interface VectorSearchResult {
  userId: string;
  similarityScore: number; // Aggregated score
  breakdown: {
    profileScore: number; // User A's Prefs vs User B's Profile
    reciprocalScore: number; // User B's Prefs vs User A's Profile
    compScore: number; // User A's Comp vs User B's Comp
  };
  metadata: any;
}

/**
 * BIDIRECTIONAL MATCHING LOGIC:
 * 1. Find candidates whose PROFILES match the current user's PREFS.
 * 2. Find candidates whose PREFS match the current user's PROFILE.
 * 3. Find candidates whose COMP answers match the current user's COMP.
 * 4. Aggregate and weight the results.
 */
export async function searchSimilarUsers(
  options: VectorSearchOptions
): Promise<VectorSearchResult[]> {
  const {
    user,
    topK = matchingConfig.VECTOR_SEARCH_TOP_K || 20,
    minSimilarityScore = matchingConfig.MIN_SIMILARITY_SCORE || 0.5
  } = options;

  try {
    const index = await getIndex();
    const userIdStr = String(user._id);

    // 1. Get embeddings for search
    const [profileEmb, prefsEmb, compEmb] = await Promise.all([
      generateEmbedding(generateProfileText(user)),
      generateEmbedding(generatePrefsText(user)),
      generateEmbedding(generateCompText(user)),
    ]);

    // 2. Build metadata filter
    const pref = user.preferences;
    const filter: any = { isPodcastActive: false };

    if (matchingConfig.ENABLE_PREFERENCE_FILTERS) {
      if (matchingConfig.PREFERENCE_FILTERS.GENDER && pref.gender?.length) {
        filter.gender = { $in: pref.gender };
      }
      if (matchingConfig.PREFERENCE_FILTERS.AGE && pref.age?.min && pref.age?.max) {
        filter.age = { $gte: pref.age.min, $lte: pref.age.max };
      }
    }

    if (matchingConfig.ENABLE_MATCH_LOGGING) {
      console.log(`🔍 Vector search filters:`, JSON.stringify(filter, null, 2));
    }

    // 3. Execute 3 queries parallel
    const [matchesProfile, matchesReciprocal, matchesComp] = await Promise.all([
      // Query 1: My Prefs vs Others' Profiles
      index.query({
        vector: prefsEmb,
        topK: topK * 5,
        filter: { ...filter, type: VectorType.PROFILE },
        includeMetadata: true,
      }),
      // Query 2: My Profile vs Others' Prefs
      index.query({
        vector: profileEmb,
        topK: topK * 5,
        filter: { type: VectorType.PREFS }, // Less strict filter for reciprocal
        includeMetadata: true,
      }),
      // Query 3: My Comp vs Others' Comp
      index.query({
        vector: compEmb,
        topK: topK * 5,
        filter: { ...filter, type: VectorType.COMP },
        includeMetadata: true,
      }),
    ]);

    // 4. Aggregate results
    const candidateMap = new Map<string, VectorSearchResult>();

    // Process Forward Matches (My Prefs -> Their Profile)
    for (const m of matchesProfile.matches) {
      const uId = m.metadata?.userId as string;
      if (!uId || uId === userIdStr) continue;

      candidateMap.set(uId, {
        userId: uId,
        similarityScore: 0,
        breakdown: { profileScore: m.score || 0, reciprocalScore: 0, compScore: 0 },
        metadata: m.metadata,
      });
    }

    // Process Reciprocal (Their Prefs -> My Profile)
    for (const m of matchesReciprocal.matches) {
      const uId = m.metadata?.userId as string;
      if (!uId || uId === userIdStr) continue;

      if (candidateMap.has(uId)) {
        candidateMap.get(uId)!.breakdown.reciprocalScore = m.score || 0;
      } else {
        // Only if forward match didn't find them, but they want US
        // We still consider them if they meet our basic filters (checked later)
        candidateMap.set(uId, {
          userId: uId,
          similarityScore: 0,
          breakdown: { profileScore: 0, reciprocalScore: m.score || 0, compScore: 0 },
          metadata: m.metadata, // Metadata from PREFS vector is same as PROFILE
        });
      }
    }

    // Process Comp
    for (const m of matchesComp.matches) {
      const uId = m.metadata?.userId as string;
      if (!uId || uId === userIdStr) continue;

      if (candidateMap.has(uId)) {
        candidateMap.get(uId)!.breakdown.compScore = m.score || 0;
      }
    }

    // 5. Calculate final weighted score and finalize results
    const results: VectorSearchResult[] = [];
    const candidates = Array.from(candidateMap.values());

    for (const c of candidates) {
      // WEIGHTS: Profile(0.4), Reciprocal(0.35), Comp(0.25)
      // If a score is 0 (no match in topK), we treat it as a neutral/low score
      const finalScore =
        (c.breakdown.profileScore * 0.4) +
        (c.breakdown.reciprocalScore * 0.35) +
        (c.breakdown.compScore * 0.25);

      c.similarityScore = finalScore;

      // Filter by min score
      if (finalScore < minSimilarityScore) continue;

      // Distance filter
      if (matchingConfig.PREFERENCE_FILTERS.DISTANCE && pref.distance) {
        const dist = calculateDistance(
          user.location.latitude,
          user.location.longitude,
          c.metadata.latitude,
          c.metadata.longitude
        );
        if (dist > pref.distance) continue;
      }

      results.push(c);
    }

    // Sort and return topK
    return results.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, topK);
  } catch (error: any) {
    console.error("Error searching similar users:", error.message);
    throw error;
  }
}

/**
 * Get index statistics
 */
export async function getIndexStats() {
  try {
    const index = await getIndex();
    return await index.describeIndexStats();
  } catch (error: any) {
    console.error("❌ Error getting index stats:", error.message);
    throw error;
  }
}

/**
 * Check if a user exists in Pinecone
 */
export async function userVectorExists(userId: string): Promise<boolean> {
  try {
    const index = await getIndex();
    const result = await index.fetch([`${userId}#${VectorType.PROFILE}`]);
    return !!result.records[`${userId}#${VectorType.PROFILE}`];
  } catch (error) {
    return false;
  }
}

/**
 * Delete all vectors from the index (Clean)
 */
export async function deleteAllVectors() {
  try {
    const index = await getIndex();
    console.log(`🧹 Cleaning index ${INDEX_NAME}...`);
    await index.deleteAll();
    console.log(`✅ Index ${INDEX_NAME} cleaned successfully`);
  } catch (error: any) {
    console.error("❌ Error cleaning index:", error.message);
    throw error;
  }
}

export default {
  getIndex,
  createIndex,
  upsertUserVector,
  batchUpsertUserVectors,
  deleteUserVector,
  deleteAllVectors,
  searchSimilarUsers,
  getIndexStats,
  userVectorExists,
};
