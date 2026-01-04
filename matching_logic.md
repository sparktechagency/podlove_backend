# Bidirectional & Reciprocal Matching Logic

The Podlove matching system uses a sophisticated "Multi-Vector" approach to ensure high-quality, reciprocal matches. This document explains how the logic works and how results are calculated.

## 1. The Multi-Vector Strategy

Instead of representing a user with a single vector (which mixes what they *are* and what they *want*), each user is represented by **three distinct vectors** in Pinecone:

| Vector Type | Content | Purpose |
| :--- | :--- | :--- |
| **PROFILE** | User's Bio, Interests, Personality traits, Ethnicity | Represents **who the user is**. |
| **PREFS** | Survey responses, Preferences (gender, age, body type) | Represents **what the user is looking for**. |
| **COMP** | Compatibility question answers | Represents **life values and relationship style**. |

## 2. Bidirectional Matching Calculation

When searching for matches for **User A**, the system performs three parallel semantic searches and aggregates the results:

### A. Forward Match (Profile Fit)
> *Query:* User A (PREFS) vs. Others (PROFILE)
> *Logic:* Find people who match what User A is looking for.

### B. Reciprocal Match (Preference Fit)
> *Query:* User A (PROFILE) vs. Others (PREFS)
> *Logic:* Find people who are looking for someone like User A.

### C. Compatibility Match (Value Fit)
> *Query:* User A (COMP) vs. Others (COMP)
> *Logic:* Find people who have similar values and lifestyle choices.

## 3. Two-Stage Scoring Process

The final match score is a hybrid of **Semantic Search** and **AI Refinement**.

### Stage 1: Vector Aggregation (The "Reciprocal" Score)
The initial similarity is calculated from the three vectors above:
`VectorScore = (ProfileFit * 0.40) + (PreferenceFit * 0.35) + (ValueFit * 0.25)`

### Stage 2: AI Refinement (Optional)
If `ENABLE_AI_COMPATIBILITY` is on, GPT-4 analyzes the full profiles.
The final displayed score is weighted between Stage 1 and Stage 2:
`Final Score = (VectorScore * matchingConfig.SCORE_WEIGHTS.VECTOR) + (AIScore * matchingConfig.SCORE_WEIGHTS.AI)`

## 4. Hard Filters

Before AI/Vector scoring, hard filters are applied to the candidate pool:
1. **Gender:** Must match User A's gender preference.
2. **Age:** Must fall within User A's preferred age range.
3. **Distance:** Must be within User A's maximum distance (if enabled).
4. **Activity:** Users currently in an active podcast are excluded.

## 5. Usage

To test the matching for a specific user and see the detailed breakdown:

```bash
pnpm test:matching <USER_ID>
```

To re-migrate all users from MongoDB to Pinecone with the new 3-vector structure:

```bash
npx ts-node -r tsconfig-paths/register scripts/migrateToPinecone.ts
```
