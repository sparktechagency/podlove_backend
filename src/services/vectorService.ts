import { Pinecone } from "@pinecone-database/pinecone";
import { UserSchema } from "@models/userModel";
import { generateUserEmbeddingData, generateUserEmbedding } from "./embeddingService";
import { calculateDistance } from "@utils/calculateDistanceUtils";
import { ageToDOB } from "@utils/ageUtils";
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
    if (matchingConfig.ENABLE_MATCH_LOGGING) {
      console.log(`📡 Connecting to Pinecone index: ${INDEX_NAME}...`);
    }
    const index = pinecone.index(INDEX_NAME);
    return index;
  } catch (error) {
    console.error("❌ Error getting Pinecone index:", error);
    throw error;
  }
}

/**
 * Create Pinecone index (run once during setup)
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
 * Upsert a single user's embedding into Pinecone
 */
export async function upsertUserVector(user: UserSchema): Promise<void> {
  try {
    console.log(`📤 Preparing vector upsert for user: ${user._id} (${user.name})`);
    const embeddingData = await generateUserEmbeddingData(user);
    const index = await getIndex();

    await index.upsert([
      {
        id: embeddingData.userId,
        values: embeddingData.embedding,
        metadata: embeddingData.metadata as any,
      },
    ]);

    console.log(`✅ Pinecone: User ${embeddingData.userId} vector upserted successfully`);
  } catch (error: any) {
    console.error(`❌ Error upserting user ${user._id}:`, error.message);
    throw error;
  }
}

/**
 * Batch upsert multiple user vectors
 * Useful for initial migration or bulk updates
 */
export async function batchUpsertUserVectors(users: UserSchema[]): Promise<void> {
  try {
    const index = await getIndex();
    const BATCH_SIZE = 100; // Pinecone recommended batch size

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      const vectors = await Promise.all(
        batch.map(async (user) => {
          try {
            const embeddingData = await generateUserEmbeddingData(user);
            return {
              id: embeddingData.userId,
              values: embeddingData.embedding,
              metadata: embeddingData.metadata as any,
            };
          } catch (error) {
            console.error(`Failed to process user ${user._id}:`, error);
            return null;
          }
        })
      );

      const validVectors = vectors.filter((v): v is NonNullable<typeof v> => v !== null);

      if (validVectors.length > 0) {
        await index.upsert(validVectors);
        console.log(`Batch ${i / BATCH_SIZE + 1}: Upserted ${validVectors.length} vectors`);
      }

      // Rate limiting delay
      if (i + BATCH_SIZE < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Successfully upserted ${users.length} user vectors`);
  } catch (error: any) {
    console.error("Error in batch upsert:", error.message);
    throw error;
  }
}

/**
 * Delete a user's vector from Pinecone
 */
export async function deleteUserVector(userId: string): Promise<void> {
  try {
    const index = await getIndex();
    console.log(`🗑️ Deleting vector for user: ${userId}...`);
    await index.deleteOne(userId);
    // console.log(`✅ User ${userId} vector deleted successfully from Pinecone`);
  } catch (error: any) {
    console.error(`❌ Error deleting user ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Search for similar users using vector similarity
 */
interface VectorSearchOptions {
  user: UserSchema;
  topK?: number;
  minSimilarityScore?: number;
}

interface VectorSearchResult {
  userId: string;
  similarityScore: number;
  metadata: any;
}

export async function searchSimilarUsers(
  options: VectorSearchOptions
): Promise<VectorSearchResult[]> {
  const {
    user,
    topK = matchingConfig.VECTOR_SEARCH_TOP_K,
    minSimilarityScore = matchingConfig.MIN_SIMILARITY_SCORE
  } = options;

  try {
    // Generate query embedding
    const queryEmbedding = await generateUserEmbedding(user);
    const index = await getIndex();

    // Build metadata filter based on configuration
    const pref = user.preferences;
    const userAge = user.dateOfBirth ? calculateAge(user.dateOfBirth) : 0;

    // Note: Pinecone metadata filtering syntax
    const filter: any = {};

    // Always filter out users in active podcasts
    if (matchingConfig.PREFERENCE_FILTERS.IS_PODCAST_ACTIVE) {
      filter.isPodcastActive = false;
    }

    // Apply preference-based filters if enabled
    if (matchingConfig.ENABLE_PREFERENCE_FILTERS) {
      // Gender filter
      if (matchingConfig.PREFERENCE_FILTERS.GENDER && pref.gender?.length) {
        filter.gender = { $in: pref.gender };
        if (matchingConfig.ENABLE_MATCH_LOGGING) {
          console.log(`🔍 Vector search - Gender filter: ${pref.gender.join(', ')}`);
        }
      }

      // Body type filter
      if (matchingConfig.PREFERENCE_FILTERS.BODY_TYPE && pref.bodyType?.length) {
        filter.bodyType = { $in: pref.bodyType };
        if (matchingConfig.ENABLE_MATCH_LOGGING) {
          console.log(`🔍 Vector search - Body type filter: ${pref.bodyType.join(', ')}`);
        }
      }

      // Age range filter
      if (matchingConfig.PREFERENCE_FILTERS.AGE && pref.age?.min && pref.age?.max) {
        filter.age = {
          $gte: pref.age.min,
          $lte: pref.age.max,
        };
        if (matchingConfig.ENABLE_MATCH_LOGGING) {
          console.log(`🔍 Vector search - Age filter: ${pref.age.min}-${pref.age.max}`);
        }
      }
    }

    if (matchingConfig.ENABLE_MATCH_LOGGING) {
      console.log(`🔍 Vector search filters:`, JSON.stringify(filter, null, 2));
    }

    // Query Pinecone
    if (matchingConfig.ENABLE_MATCH_LOGGING) {
      console.log(`🔎 Querying Pinecone for similar users (topK: ${topK})...`);
    }
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: topK * 2, // Get more to filter by distance
      filter,
      includeMetadata: true,
    });

    if (matchingConfig.ENABLE_MATCH_LOGGING) {
      console.log(`✨ Pinecone returned ${queryResponse.matches.length} raw matches`);
    }

    // Post-filter by distance (if enabled)
    const results: VectorSearchResult[] = [];

    for (const match of queryResponse.matches) {
      // Skip self
      if (match.id === String(user._id)) continue;

      // Check similarity threshold
      if (match.score && match.score < minSimilarityScore) continue;

      // Distance filtering (if enabled)
      const metadata = match.metadata;
      if (metadata?.latitude && metadata?.longitude) {
        let includeUser = true;

        if (matchingConfig.ENABLE_PREFERENCE_FILTERS && matchingConfig.PREFERENCE_FILTERS.DISTANCE) {
          const maxDistance = pref.distance || matchingConfig.DEFAULT_MAX_DISTANCE;
          const distance = calculateDistance(
            user.location.latitude,
            user.location.longitude,
            metadata.latitude as number,
            metadata.longitude as number
          );
          includeUser = distance <= maxDistance;

          if (matchingConfig.ENABLE_MATCH_LOGGING && includeUser) {
            // console.log(`✅ User ${match.id}: distance ${distance.toFixed(2)} miles (max: ${maxDistance})`);
          }
        }

        if (includeUser) {
          results.push({
            userId: match.id,
            similarityScore: match.score || 0,
            metadata: metadata,
          });
        }
      }
    }

    if (matchingConfig.ENABLE_MATCH_LOGGING) {
      console.log(`📊 Vector search found ${results.length} candidates after all filters`);
    }

    // Return top K after distance filtering
    return results.slice(0, topK);
  } catch (error: any) {
    console.error("Error searching similar users:", error.message);
    throw error;
  }
}

/**
 * Helper function to calculate age from dateOfBirth
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
 * Get index statistics
 */
export async function getIndexStats() {
  try {
    const index = await getIndex();
    console.log(`📊 Fetching statistics for Pinecone index: ${INDEX_NAME}...`);
    const stats = await index.describeIndexStats();
    console.log(`📈 Index Stats: Total ${stats.totalRecordCount} vectors, dimension: ${stats.dimension}`);
    return stats;
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
    const result = await index.fetch([userId]);
    return !!result.records[userId];
  } catch (error) {
    return false;
  }
}

export default {
  getIndex,
  createIndex,
  upsertUserVector,
  batchUpsertUserVectors,
  deleteUserVector,
  searchSimilarUsers,
  getIndexStats,
  userVectorExists,
};
