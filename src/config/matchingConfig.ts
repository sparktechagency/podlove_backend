/**
 * ===================================
 * PODLOVE MATCHING CONFIGURATION
 * ===================================
 * 
 * This file controls all aspects of the AI-powered matching system.
 * Adjust these settings to customize match quality, performance, and user experience.
 * 
 * ARCHITECTURE:
 * 1. Vector Search (Pinecone) - Semantic similarity using embeddings
 * 2. AI Scoring (OpenAI GPT) - Deep compatibility analysis
 * 3. Preference Filters - User-defined matching criteria
 * 4. Subscription Limits - Tier-based match counts
 * 
 * @author Podlove Backend Team
 * @version 2.0.0
 */

// ===================================
// FILTER TOGGLE SWITCHES
// ===================================

/**
 * Master switch for all preference-based filtering.
 * When FALSE: Shows all users regardless of preferences (max AI matches)
 * When TRUE: Respects user preferences (age, gender, body type, etc.)
 * 
 * ⚠️ WARNING: Disabling filters increases match pool but may reduce match quality
 */
export const ENABLE_PREFERENCE_FILTERS = true;

/**
 * Enable/disable individual preference filters.
 * Only applies when ENABLE_PREFERENCE_FILTERS = true
 * 
 * Use Case: You might want to enforce gender preference but relax age requirements
 */
export const PREFERENCE_FILTERS = {
    /** Filter by gender preference (e.g., only show men to users seeking men) */
    GENDER: true,

    /** Filter by age range preference (e.g., 25-35 years old) */
    AGE: false,

    /** Filter by body type preference (e.g., athletic, average, curvy) */
    BODY_TYPE: false,

    /** Filter by ethnicity preference */
    ETHNICITY: false,

    /** Filter by maximum distance in miles (geographic proximity) */
    DISTANCE: true,

    /**
     * Filter out users who are already matched in active podcasts
     * ⚠️ RECOMMENDED: Keep TRUE to avoid showing users in active sessions
     */
    IS_PODCAST_ACTIVE: false,

    /**
     * Exclude the requesting user from their own matches
     * ⚠️ CRITICAL: Must remain TRUE
     */
    EXCLUDE_SELF: true,
};

/**
 * Enable subscription-based match count limits.
 * When FALSE: All users get the same max match count
 * When TRUE: Match count varies by subscription tier (Sampler: 2, Seeker: 3, Scout: 4)
 */
export const ENABLE_SUBSCRIPTION_LIMITS = false;

/**
 * Enable spotlight (match quota) enforcement.
 * When FALSE: Users can find matches unlimited times
 * When TRUE: Users must have spotlight quota remaining
 */
export const ENABLE_SPOTLIGHT_QUOTA = false;

// ===================================
// MATCH COUNT CONFIGURATION
// ===================================

/**
 * Default match count when subscription limits are disabled.
 * Recommended: 5-10 for good variety without overwhelming users
 */
export const DEFAULT_MATCH_COUNT = 4;

/**
 * Match counts per subscription tier.
 * Only applies when ENABLE_SUBSCRIPTION_LIMITS = true
 */
export const SUBSCRIPTION_MATCH_COUNTS = {
    SAMPLER: 10,   // Free tier
    SEEKER: 20,    // Mid tier
    SCOUT: 40,     // Premium tier
};

// ===================================
// VECTOR SEARCH CONFIGURATION
// ===================================

/**
 * Number of candidates to retrieve from Pinecone vector search.
 * Higher = More options for AI to score, but slower and costlier
 * Lower = Faster but less variety
 * 
 * Formula: VECTOR_SEARCH_TOP_K = Desired matches × multiplier
 * Recommended: 2-3× the final match count
 */
export const VECTOR_SEARCH_TOP_K = 20;

/**
 * Minimum similarity score (0.0 - 1.0) for vector matches.
 * Higher = More similar profiles only
 * Lower = Broader matching
 * 
 * Recommended ranges:
 * - Strict matching: 0.7 - 1.0
 * - Balanced: 0.5 - 0.7
 * - Exploratory: 0.3 - 0.5
 */
export const MIN_SIMILARITY_SCORE = 0.5;

/**
 * Enable automatic fallback to traditional matching when vector search fails.
 * Recommended: TRUE for production reliability
 */
export const ENABLE_VECTOR_FALLBACK = false;

// ===================================
// AI COMPATIBILITY SCORING
// ===================================

/**
 * Enable AI-based compatibility scoring with reasoning.
 * When FALSE: Uses simple compatibility question comparison
 * When TRUE: Uses GPT-4 for deep analysis (slower, more expensive, higher quality)
 */
export const ENABLE_AI_COMPATIBILITY = true;

/**
 * OpenAI model for compatibility analysis.
 * Options: 'gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'
 * 
 * Performance vs Cost:
 * - gpt-4o: Best quality, highest cost, moderate speed
 * - gpt-4-turbo: Great quality, high cost, faster
 * - gpt-3.5-turbo: Good quality, low cost, fastest
 */
export const AI_MODEL = "gpt-4o";

/**
 * Temperature for AI compatibility scoring (0.0 - 1.0).
 * Lower = More consistent, factual responses
 * Higher = More creative, varied responses
 * 
 * Recommended: 0.3 for consistent compatibility scoring
 */
export const AI_TEMPERATURE = 0.3;

/**
 * Maximum tokens for AI compatibility response.
 * Higher = More detailed reasoning, higher cost
 * Lower = Concise reasoning, lower cost
 * 
 * Typical response: 100-150 tokens
 */
export const AI_MAX_TOKENS = 200;

/**
 * Weight distribution for final match score calculation.
 * 
 * Formula: Final Score = (Vector Similarity × VECTOR_WEIGHT) + (AI Score × AI_WEIGHT)
 * 
 * Examples:
 * - Equal weight: { VECTOR: 0.5, AI: 0.5 }
 * - Favor AI: { VECTOR: 0.3, AI: 0.7 }
 * - Favor embeddings: { VECTOR: 0.7, AI: 0.3 }
 * 
 * ⚠️ Must sum to 1.0
 */
export const SCORE_WEIGHTS = {
    VECTOR: 0.4,  // Semantic similarity from embeddings
    AI: 0.6,      // Deep compatibility from GPT analysis
};

// ===================================
// DISTANCE FILTERING
// ===================================

/**
 * Default maximum distance in miles if user hasn't set preference.
 * Used when distance filter is enabled
 */
export const DEFAULT_MAX_DISTANCE = 50;

/**
 * Fallback distance for relaxed matching.
 * Used when strict filters return too few results
 */
export const FALLBACK_MAX_DISTANCE = 100;

// ===================================
// PERFORMANCE OPTIMIZATION
// ===================================

/**
 * Enable parallel processing for AI compatibility scoring.
 * TRUE = Score all candidates simultaneously (faster, higher API usage)
 * FALSE = Score candidates sequentially (slower, respects rate limits)
 */
export const ENABLE_PARALLEL_AI_SCORING = true;

/**
 * Rate limiting: Delay between AI requests in milliseconds.
 * Only applies when ENABLE_PARALLEL_AI_SCORING = false
 * 
 * Recommended: 100-500ms to avoid rate limits
 */
export const AI_REQUEST_DELAY_MS = 200;

/**
 * Cache AI compatibility scores for repeat matches.
 * Reduces cost and improves speed for frequently matched pairs
 * 
 * ⚠️ TODO: Implement caching layer (Redis recommended)
 */
export const ENABLE_SCORE_CACHING = false;

/**
 Cache TTL (Time To Live) in hours.
 * How long to keep cached compatibility scores
 */
export const SCORE_CACHE_TTL_HOURS = 24;

// ===================================
// FALLBACK CONFIGURATION
// ===================================

/**
 * Fallback strategy when not enough matches are found.
 * 
 * Options:
 * - 'relax_filters': Gradually relax preference filters
 * - 'random': Return random compatible users
 * - 'none': Return whatever matches were found
 */
export const FALLBACK_STRATEGY = 'relax_filters';

/**
 * Minimum matches required before triggering fallback.
 * If matches < threshold, apply fallback strategy
 */
export const FALLBACK_THRESHOLD = 3;

/**
 * Filter relaxation order (most to least important).
 * When using 'relax_filters' strategy
 */
export const FILTER_RELAXATION_ORDER = [
    'BODY_TYPE',    // Relax first
    'ETHNICITY',
    'AGE',
    'DISTANCE',
    'GENDER',       // Relax last (usually most important)
];

// ===================================
// METADATA CONFIGURATION
// ===================================

/**
 * Fields to include in Pinecone metadata for filtering.
 * More fields = More flexible filtering, but larger index
 */
export const PINECONE_METADATA_FIELDS = [
    'gender',
    'age',
    'bodyType',
    'ethnicity',
    'latitude',
    'longitude',
    'isPodcastActive',
    'name',
    'isProfileComplete',
];

/**
 * Fields to embed in vector (semantic search).
 * These contribute to similarity matching
 */
export const EMBEDDING_FIELDS = [
    'bio',
    'interests',
    'compatibility',
    'personality',
    'survey',
    'ethnicity',
];

// ===================================
// QUALITY CONTROLS
// ===================================

/**
 * Minimum profile completeness percentage to be eligible for matching.
 * 0 = No requirement, 100 = Fully complete profile required
 * 
 * Recommended: 60-80 for quality matches
 */
export const MIN_PROFILE_COMPLETENESS = 0;

/**
 * Require compatibility questions to be answered.
 * TRUE = Only match users who completed compatibility quiz
 * FALSE = Match anyone
 */
export const REQUIRE_COMPATIBILITY_ANSWERS = false;

/**
 * Minimum number of compatibility answers required.
 * Only applies when REQUIRE_COMPATIBILITY_ANSWERS = true
 */
export const MIN_COMPATIBILITY_ANSWERS = 10;

// ===================================
// LOGGING & DEBUGGING
// ===================================

/**
 * Enable detailed matching logs (performance metrics, scores, etc.)
 * Useful for debugging and optimization
 */
export const ENABLE_MATCH_LOGGING = true;

/**
 * Log AI prompts and responses.
 * ⚠️ WARNING: May expose sensitive user data in logs
 */
export const LOG_AI_INTERACTIONS = false;

/**
 * Include reasoning in match results returned to frontend.
 * TRUE = Send AI reasoning to client (more transparent)
 * FALSE = Return scores only (faster, less data transfer)
 */
export const INCLUDE_REASONING_IN_RESPONSE = true;

// ===================================
// HELPER FUNCTIONS
// ===================================

/**
 * Get match count based on subscription tier.
 * Respects ENABLE_SUBSCRIPTION_LIMITS setting
 */
export function getMatchCount(subscriptionPlan: string): number {
    if (!ENABLE_SUBSCRIPTION_LIMITS) {
        return DEFAULT_MATCH_COUNT;
    }

    return SUBSCRIPTION_MATCH_COUNTS[subscriptionPlan as keyof typeof SUBSCRIPTION_MATCH_COUNTS]
        || SUBSCRIPTION_MATCH_COUNTS.SAMPLER;
}

/**
 * Check if any preference filters are enabled.
 */
export function hasActiveFilters(): boolean {
    if (!ENABLE_PREFERENCE_FILTERS) return false;

    return Object.entries(PREFERENCE_FILTERS)
        .filter(([key]) => key !== 'EXCLUDE_SELF' && key !== 'IS_PODCAST_ACTIVE')
        .some(([_, enabled]) => enabled);
}

/**
 * Get enabled filter names for logging.
 */
export function getEnabledFilters(): string[] {
    if (!ENABLE_PREFERENCE_FILTERS) return [];

    return Object.entries(PREFERENCE_FILTERS)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => name);
}

/**
 * Validate configuration on import.
 */
function validateConfig() {
    // Check score weights sum to 1.0
    const weightSum = SCORE_WEIGHTS.VECTOR + SCORE_WEIGHTS.AI;
    if (Math.abs(weightSum - 1.0) > 0.001) {
        console.warn(
            `⚠️ WARNING: SCORE_WEIGHTS sum to ${weightSum}, should be 1.0. ` +
            `Vector: ${SCORE_WEIGHTS.VECTOR}, AI: ${SCORE_WEIGHTS.AI}`
        );
    }

    // Check similarity score range
    if (MIN_SIMILARITY_SCORE < 0 || MIN_SIMILARITY_SCORE > 1) {
        console.error(`❌ ERROR: MIN_SIMILARITY_SCORE must be between 0 and 1, got ${MIN_SIMILARITY_SCORE}`);
    }

    // Log current configuration
    if (ENABLE_MATCH_LOGGING) {
        console.log('📊 Matching Configuration Loaded:');
        console.log(`   - Preference Filters: ${ENABLE_PREFERENCE_FILTERS ? 'ENABLED' : 'DISABLED'}`);
        console.log(`   - Active Filters: ${getEnabledFilters().join(', ') || 'NONE'}`);
        console.log(`   - Subscription Limits: ${ENABLE_SUBSCRIPTION_LIMITS ? 'ENABLED' : 'DISABLED'}`);
        console.log(`   - Default Match Count: ${DEFAULT_MATCH_COUNT}`);
        console.log(`   - AI Compatibility: ${ENABLE_AI_COMPATIBILITY ? 'ENABLED' : 'DISABLED'}`);
        console.log(`   - Vector Search Top-K: ${VECTOR_SEARCH_TOP_K}`);
        console.log(`   - Score Weights: Vector ${SCORE_WEIGHTS.VECTOR * 100}% / AI ${SCORE_WEIGHTS.AI * 100}%`);
    }
}

// Run validation on import
validateConfig();

export default {
    ENABLE_PREFERENCE_FILTERS,
    PREFERENCE_FILTERS,
    ENABLE_SUBSCRIPTION_LIMITS,
    ENABLE_SPOTLIGHT_QUOTA,
    DEFAULT_MATCH_COUNT,
    SUBSCRIPTION_MATCH_COUNTS,
    VECTOR_SEARCH_TOP_K,
    MIN_SIMILARITY_SCORE,
    ENABLE_VECTOR_FALLBACK,
    ENABLE_AI_COMPATIBILITY,
    AI_MODEL,
    AI_TEMPERATURE,
    AI_MAX_TOKENS,
    SCORE_WEIGHTS,
    DEFAULT_MAX_DISTANCE,
    FALLBACK_MAX_DISTANCE,
    ENABLE_PARALLEL_AI_SCORING,
    AI_REQUEST_DELAY_MS,
    ENABLE_SCORE_CACHING,
    SCORE_CACHE_TTL_HOURS,
    FALLBACK_STRATEGY,
    FALLBACK_THRESHOLD,
    FILTER_RELAXATION_ORDER,
    PINECONE_METADATA_FIELDS,
    EMBEDDING_FIELDS,
    MIN_PROFILE_COMPLETENESS,
    REQUIRE_COMPATIBILITY_ANSWERS,
    MIN_COMPATIBILITY_ANSWERS,
    ENABLE_MATCH_LOGGING,
    LOG_AI_INTERACTIONS,
    INCLUDE_REASONING_IN_RESPONSE,
    getMatchCount,
    hasActiveFilters,
    getEnabledFilters,
};
