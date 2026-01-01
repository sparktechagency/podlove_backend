# Podlove Matching API - Mobile Integration Guide

> **Version:** 1.0  
> **Last Updated:** January 2026  
> **Backend:** Node.js + TypeScript + Express  
> **AI Engine:** OpenAI GPT-4 + Pinecone Vector Database

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Authentication](#authentication)
4. [Core Matching Endpoints](#core-matching-endpoints)
5. [Matching Algorithm Explained](#matching-algorithm-explained)
6. [Data Models](#data-models)
7. [Configuration Reference](#configuration-reference)
8. [Integration Flow](#integration-flow)
9. [Code Examples](#code-examples)
10. [Error Handling](#error-handling)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Podlove Matching API uses a **hybrid AI-powered matching system** that combines:

- **Semantic Vector Search** (Pinecone) - 80% weight
- **GPT-4 Compatibility Analysis** - 20% weight
- **User Preference Filtering** (age, gender, distance, body type, ethnicity)
- **Subscription-Based Match Limits**

### Key Features

✅ AI-generated compatibility reasoning  
✅ Real-time semantic similarity scoring  
✅ Configurable preference filters  
✅ Subscription tier-based match counts  
✅ Automatic fallback to traditional matching  
✅ Distance-based filtering with coordinates

---

## System Architecture

```
┌─────────────────┐
│  Mobile App     │
│  (iOS/Android)  │
└────────┬────────┘
         │ HTTP/REST
         │ JWT Auth
         ▼
┌─────────────────────────────────────────┐
│         Express Backend                  │
│  ┌──────────────────────────────────┐  │
│  │  Auth Middleware (JWT)           │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  Matching Controller             │  │
│  │  - findMatch()                   │  │
│  │  - getMatchedUsers()             │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  Matching Service                │  │
│  │  - findMatchesWithVectors()      │  │
│  │  - findMatchesTraditional()      │  │
│  │  - getCompatibilityScore()       │  │
│  └──────────────────────────────────┘  │
└───┬─────────────────┬─────────────┬────┘
    │                 │             │
    ▼                 ▼             ▼
┌─────────┐    ┌──────────┐   ┌──────────┐
│ MongoDB │    │ Pinecone │   │  OpenAI  │
│ Atlas   │    │  Vector  │   │  GPT-4   │
└─────────┘    └──────────┘   └──────────┘
```

---

## Authentication

All matching endpoints require JWT authentication.

### 1. Login Flow

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "user@example.com",
      "isVerified": true
    }
  }
}
```

### 2. Using the Token

Include the JWT token in all subsequent requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Token Payload Structure

The backend decodes the token and attaches user info to `req.user`:

```typescript
{
  authId: string,      // Auth collection ID
  userId: string,      // User collection ID
  name: string,
  email: string,
  isVerified: boolean
}
```

---

## Core Matching Endpoints

### 🎯 1. Find New Matches (AI Matching)

**Purpose:** Trigger AI-powered matching algorithm to find compatible users.

**Endpoint:** `GET /user/match/findMatch`

**Authentication:** ✅ Required

**When to Use:**
- User taps "Find Matches" button
- User wants to refresh/update their matches
- First-time matching experience

**Backend Process:**
1. Validates user authentication
2. Checks subscription plan and spotlight quota
3. Ensures user profile is complete
4. Performs hybrid vector + AI matching
5. Creates/updates Podcast document with matched participants
6. Decrements spotlight quota (if enabled)
7. Returns matched users with compatibility scores

**Request:**
```http
GET /user/match/findMatch
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User successfully updated matches for the podcast",
  "data": {
    "_id": "65abc123def456789",
    "primaryUser": "507f1f77bcf86cd799439011",
    "participants": [
      {
        "user": {
          "_id": "507f191e810c19729de860ea",
          "name": "Sarah Johnson",
          "avatar": "https://storage.example.com/avatars/sarah.jpg"
        },
        "score": 87,
        "vectorScore": 92,
        "aiScore": 75,
        "reasoning": "Strong alignment in communication style and shared interests in outdoor activities. Both value emotional connection and have compatible lifestyle preferences.",
        "isAllow": false,
        "isRequest": false,
        "role": "Sparks"
      },
      {
        "user": {
          "_id": "507f191e810c19729de860eb",
          "name": "Emily Chen",
          "avatar": "https://storage.example.com/avatars/emily.jpg"
        },
        "score": 82,
        "vectorScore": 85,
        "aiScore": 78,
        "reasoning": "Excellent compatibility in values and long-term goals. Similar approaches to conflict resolution and balanced personalities.",
        "isAllow": false,
        "isRequest": false,
        "role": "Sparks"
      }
    ],
    "status": "NotScheduled",
    "createdAt": "2026-01-01T10:30:00.000Z",
    "updatedAt": "2026-01-01T10:30:00.000Z"
  }
}
```

**Response Fields Explained:**

| Field | Type | Description |
|-------|------|-------------|
| `score` | Number (0-100) | **Final weighted compatibility score** (80% vector + 20% AI) |
| `vectorScore` | Number (0-100) | Semantic similarity from Pinecone vector search |
| `aiScore` | Number (0-100) | GPT-4 compatibility assessment |
| `reasoning` | String | AI-generated explanation of compatibility |
| `isAllow` | Boolean | Whether user confirmed participation |
| `isRequest` | Boolean | Whether user sent join request |
| `role` | String | "Spotlight" (initiator) or "Sparks" (matched users) |

---

### 📋 2. Get Existing Matches

**Purpose:** Retrieve full profiles of users you've already been matched with.

**Endpoint:** `GET /user/match/getAll`

**Authentication:** ✅ Required

**When to Use:**
- Navigating to "My Matches" screen
- Refreshing match list after app returns from background
- Displaying match profiles with details

**Backend Process:**
1. Finds Podcast document for authenticated user
2. Populates full user profiles for all participants
3. Applies subscription-based match count limit
4. Returns enriched user data with compatibility scores

**Request:**
```http
GET /user/match/getAll
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Matched users retrieved successfully",
  "data": {
    "users": [
      {
        "_id": "507f191e810c19729de860ea",
        "name": "Sarah Johnson",
        "avatar": "https://storage.example.com/avatars/sarah.jpg",
        "bio": "Adventure enthusiast who loves hiking, photography, and meaningful conversations over coffee.",
        "dateOfBirth": "1995-03-15",
        "gender": "Female",
        "bodyType": "Athletic",
        "ethnicity": ["Caucasian"],
        "interests": ["Hiking", "Photography", "Travel", "Coffee", "Reading"],
        "personality": {
          "spectrum": 6,
          "balance": 5,
          "focus": 7
        },
        "location": {
          "place": "Seattle, WA",
          "latitude": 47.6062,
          "longitude": -122.3321
        },
        "preferences": {
          "gender": ["Male"],
          "age": { "min": 25, "max": 35 },
          "bodyType": ["Athletic", "Average"],
          "ethnicity": [],
          "distance": 50
        },
        "score": 87,
        "vectorScore": 92,
        "aiScore": 75,
        "reasoning": "Strong alignment in communication style and shared interests in outdoor activities. Both value emotional connection and have compatible lifestyle preferences.",
        "isProfileComplete": true,
        "isPodcastActive": false
      },
      {
        "_id": "507f191e810c19729de860eb",
        "name": "Emily Chen",
        "avatar": "https://storage.example.com/avatars/emily.jpg",
        "bio": "Tech professional with a passion for art, music, and exploring new restaurants.",
        "dateOfBirth": "1993-07-22",
        "gender": "Female",
        "bodyType": "Average",
        "ethnicity": ["Asian"],
        "interests": ["Technology", "Art", "Music", "Food", "Museums"],
        "personality": {
          "spectrum": 5,
          "balance": 6,
          "focus": 5
        },
        "location": {
          "place": "San Francisco, CA",
          "latitude": 37.7749,
          "longitude": -122.4194
        },
        "preferences": {
          "gender": ["Male"],
          "age": { "min": 28, "max": 38 },
          "bodyType": ["Average", "Athletic", "Slim"],
          "ethnicity": [],
          "distance": 30
        },
        "score": 82,
        "vectorScore": 85,
        "aiScore": 78,
        "reasoning": "Excellent compatibility in values and long-term goals. Similar approaches to conflict resolution and balanced personalities.",
        "isProfileComplete": true,
        "isPodcastActive": false
      }
    ]
  }
}
```

---

### 🔍 3. Discover Users (Manual Filtering)

**Purpose:** Browse users with custom filters without AI matching.

**Endpoint:** `GET /user/discover`

**Authentication:** ❌ Not Required

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | Number | Page number (1-indexed) | `1` |
| `limit` | Number | Users per page | `10` |
| `gender` | String | Filter by gender | `Female` |
| `minAge` | Number | Minimum age | `25` |
| `maxAge` | Number | Maximum age | `35` |
| `ethnicity` | String | Filter by ethnicity | `Asian` |
| `bodyType` | String | Filter by body type | `Athletic` |

**Request:**
```http
GET /user/discover?page=1&limit=10&gender=Female&minAge=25&maxAge=35
```

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [ /* Array of user objects */ ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 47,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## Matching Algorithm Explained

### Hybrid AI + Vector Matching System

The backend uses a **two-phase matching approach** with automatic fallback:

#### **Phase 1: Vector-Based Matching** (Primary)

Function: `findMatchesWithVectors()`

1. **Vector Upsert**
   - Updates user's semantic embedding in Pinecone
   - Encodes profile data (bio, interests, personality, compatibility answers)

2. **Similarity Search**
   - Queries Pinecone for top K similar users (default: 20 candidates)
   - Filters by minimum similarity score (default: 0.5)

3. **AI Compatibility Analysis** (Optional)
   - GPT-4 analyzes each candidate pair
   - Generates compatibility score (0-100)
   - Provides natural language reasoning

4. **Weighted Scoring**
   ```
   Final Score = (Vector Score × 0.8) + (AI Score × 0.2)
   ```

5. **Preference Filtering**
   - Age range (min/max)
   - Gender preferences
   - Body type preferences
   - Ethnicity preferences
   - Distance radius (miles)
   - Exclude users in active podcasts

#### **Phase 2: Traditional Matching** (Fallback)

Function: `findMatchesTraditional()`

Activated when:
- Vector search returns no results
- Pinecone service is unavailable
- User has no vector embedding yet

Process:
1. **Database Query**
   - Filters users based on preferences
   - Calculates distance using Haversine formula
   - Applies all enabled preference filters

2. **AI Scoring** (Optional)
   - GPT-4 analyzes compatibility
   - Generates reasoning for each match

3. **Fallback Strategy** (if < 3 matches found)
   - Relaxes filters (keeps only gender + distance)
   - Expands distance radius to 100 miles
   - Ensures minimum match count

---

### Matching Configuration

All matching behavior is controlled by `src/config/matchingConfig.ts`.

**Current Configuration:**

| Setting | Value | Impact |
|---------|-------|--------|
| `ENABLE_SUBSCRIPTION_LIMITS` | `false` | All users get same match count |
| `DEFAULT_MATCH_COUNT` | `3` | Number of matches returned |
| `ENABLE_PREFERENCE_FILTERS` | `true` | Apply user preference filtering |
| `ENABLE_AI_COMPATIBILITY` | `false` | Use GPT-4 for scoring (expensive) |
| `ENABLE_SPOTLIGHT_QUOTA` | `false` | Require spotlight quota to match |
| `VECTOR_SEARCH_TOP_K` | `20` | Candidates from Pinecone |
| `MIN_SIMILARITY_SCORE` | `0.5` | Minimum vector similarity |
| `SCORE_WEIGHTS.VECTOR` | `0.8` | 80% semantic similarity |
| `SCORE_WEIGHTS.AI` | `0.2` | 20% AI analysis |
| `FALLBACK_STRATEGY` | `'relax_filters'` | How to handle low matches |
| `FALLBACK_THRESHOLD` | `3` | Trigger fallback if fewer matches |
| `FALLBACK_MAX_DISTANCE` | `100` | Distance limit for fallback (miles) |

---

## Data Models

### User Schema

```typescript
{
  _id: ObjectId,
  auth: ObjectId,                    // Reference to Auth collection
  name: string,
  email: string,
  phoneNumber: string,
  dateOfBirth: string,               // ISO date string
  gender: string,                    // "Male", "Female", "Non-binary", "Other"
  bodyType: string,                  // "Athletic", "Average", "Curvy", "Slim", etc.
  ethnicity: string[],               // Array of ethnicities
  bio: string,
  personality: {
    spectrum: number,                // 1-7 scale
    balance: number,                 // 1-7 scale
    focus: number                    // 1-7 scale
  },
  interests: string[],               // Array of interests
  avatar: string,                    // URL to profile image
  compatibility: string[],           // 40 compatibility question answers
  location: {
    place: string,                   // "City, State"
    latitude: number,
    longitude: number
  },
  preferences: {
    gender: string[],                // Preferred genders
    age: {
      min: number,
      max: number
    },
    bodyType: string[],
    ethnicity: string[],
    distance: number                 // Max distance in miles
  },
  subscription: {
    id: string,
    plan: string,                    // "SAMPLER", "SEEKER", "SCOUT"
    fee: string,
    status: string,
    isSpotlight: number,             // Remaining match quota
    startedAt: Date
  },
  isProfileComplete: boolean,
  isPodcastActive: boolean,          // Currently in active podcast
  createdAt: Date,
  updatedAt: Date
}
```

### Podcast Schema

```typescript
{
  _id: ObjectId,
  primaryUser: ObjectId,             // User who initiated matching
  participants: [
    {
      user: ObjectId,                // Reference to User
      isAllow: boolean,              // User confirmed participation
      isRequest: boolean,            // User sent join request
      isQuestionAnswer: string,
      role: string,                  // "Spotlight" or "Sparks"
      score: number,                 // Final compatibility (0-100)
      vectorScore: number,           // Semantic similarity (0-100)
      aiScore: number,               // AI compatibility (0-100)
      reasoning: string              // AI-generated explanation
    }
  ],
  schedule: {
    date: string,
    day: string,
    time: string
  },
  status: string,                    // PodcastStatus enum
  recordingUrl: object[],
  roomCodes: object[],
  createdAt: Date,
  updatedAt: Date
}
```

**Podcast Status Values:**
- `NotScheduled` - Matches found, not scheduled yet
- `RequestSchedule` - Schedule requested
- `Scheduled` - Date/time confirmed
- `Upcoming` - Approaching scheduled time
- `Live` - Currently recording
- `Ended` - Recording completed
- `Done` - Fully processed

---

## Configuration Reference

### Subscription Tiers & Match Counts

```typescript
// When ENABLE_SUBSCRIPTION_LIMITS = true
SUBSCRIPTION_MATCH_COUNTS = {
  SAMPLER: 10,    // Free tier - 10 matches
  SEEKER: 20,     // Mid tier - 20 matches
  SCOUT: 40       // Premium tier - 40 matches
}

// When ENABLE_SUBSCRIPTION_LIMITS = false
// All users get DEFAULT_MATCH_COUNT (3)
```

**How It Works:**
- Function `subscriptionMatchCount()` determines allowed matches
- Checks user's `subscription.plan` field
- Returns corresponding match count
- Mobile app receives only the allowed number of matches

**Spotlight Quota System:**
```typescript
// When ENABLE_SPOTLIGHT_QUOTA = true
- User must have subscription.isSpotlight > 0 to find matches
- Each call to /findMatch decrements isSpotlight by 1
- Throws error if isSpotlight === 0
- Default spotlight quota: 2 (set in User model)

// When ENABLE_SPOTLIGHT_QUOTA = false
- Spotlight quota ignored
- Users can match unlimited times
```

### Preference Filters

All filters controlled by `PREFERENCE_FILTERS` object:

```typescript
PREFERENCE_FILTERS = {
  GENDER: true,              // Filter by gender preference
  AGE: true,                 // Filter by age range
  BODY_TYPE: true,           // Filter by body type
  ETHNICITY: true,           // Filter by ethnicity
  DISTANCE: true,            // Filter by max distance
  IS_PODCAST_ACTIVE: false,  // Exclude users in podcasts
  EXCLUDE_SELF: true         // Never match with self (critical)
}
```

**Enable/Disable All Filters:**
```typescript
ENABLE_PREFERENCE_FILTERS = true   // Master switch for all filters
```

### AI Configuration

```typescript
ENABLE_AI_COMPATIBILITY = false     // Toggle GPT-4 analysis
AI_MODEL = "gpt-4o"                 // OpenAI model
AI_TEMPERATURE = 0.3                // Deterministic responses
AI_MAX_TOKENS = 200                 // Reasoning length limit

// Cost Consideration:
// GPT-4 call per match pair ≈ $0.01
// Finding 3 matches × 20 candidates = 60 API calls
// Estimated cost per match: $0.60
// Recommendation: Keep disabled for production
```

### Distance Calculation

```typescript
DEFAULT_MAX_DISTANCE = 50           // Miles
FALLBACK_MAX_DISTANCE = 100         // Fallback radius

// Uses Haversine formula:
function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number
```

---

## Integration Flow

### Step-by-Step Mobile Integration

#### 1️⃣ **User Login**

```
User enters credentials → POST /auth/login
→ Store JWT token securely (Keychain/SharedPreferences)
→ Include token in Authorization header for all requests
```

#### 2️⃣ **Ensure Profile Completeness**

```
Check user.isProfileComplete === true
If false → Redirect to profile setup flow
Required fields:
  - Name, gender, dateOfBirth
  - Location (latitude, longitude)
  - Bio, interests, personality
  - 40 compatibility question answers
```

#### 3️⃣ **Trigger Matching (User Action)**

```
User taps "Find Matches" button
→ Show loading indicator (AI-themed animation recommended)
→ GET /user/match/findMatch with JWT token
→ Wait for response (typically 5-15 seconds)
→ Cache response locally
→ Navigate to match results screen
```

⚠️ **Important:** Do NOT auto-trigger matching on app launch. This is a heavy operation that:
- Costs money (OpenAI API calls)
- Uses Pinecone resources
- Decrements spotlight quota
- Takes significant processing time

#### 4️⃣ **Display Match Results**

```
Parse response.data.participants array
For each match:
  - Display avatar, name, age
  - Show final compatibility score (0-100)
  - Display AI reasoning in expandable card
  - Show vector vs AI score breakdown (optional)
```

**UI Recommendations:**
- Use gradient color coding for scores:
  - 90-100: Gold/Excellent
  - 75-89: Green/Great
  - 60-74: Blue/Good
  - Below 60: Gray/Consider
- Animate score bars
- Make reasoning text readable (16pt+)
- Add "View Full Profile" button

#### 5️⃣ **Retrieve Full Profiles (Navigation)**

```
User navigates to "My Matches" screen
→ GET /user/match/getAll
→ Display enriched user profiles
→ Allow filtering/sorting by score
```

#### 6️⃣ **Handle Subscription Limits**

```
Check subscription tier → Determine visible matches
SAMPLER: Show 10 matches
SEEKER: Show 20 matches
SCOUT: Show 40 matches

If user reaches limit → Show upgrade prompt
"Unlock more matches with SEEKER plan"
```

---

## Code Examples

### iOS (Swift + Combine)

```swift
import Foundation
import Combine

class MatchingService {
    private let baseURL = "https://api.podlove.com"
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Find New Matches
    func findMatches(token: String) -> AnyPublisher<MatchResponse, Error> {
        guard let url = URL(string: "\(baseURL)/user/match/findMatch") else {
            return Fail(error: URLError(.badURL)).eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: MatchResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }
    
    // MARK: - Get Existing Matches
    func getMatchedUsers(token: String) -> AnyPublisher<MatchedUsersResponse, Error> {
        guard let url = URL(string: "\(baseURL)/user/match/getAll") else {
            return Fail(error: URLError(.badURL)).eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: MatchedUsersResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }
}

// MARK: - Models
struct MatchResponse: Codable {
    let success: Bool
    let message: String
    let data: PodcastData
}

struct PodcastData: Codable {
    let id: String
    let primaryUser: String
    let participants: [Participant]
    let status: String
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case primaryUser, participants, status
    }
}

struct Participant: Codable {
    let user: MatchedUser
    let score: Int
    let vectorScore: Int
    let aiScore: Int
    let reasoning: String
    let isAllow: Bool
    let role: String
}

struct MatchedUser: Codable {
    let id: String
    let name: String
    let avatar: String
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, avatar
    }
}

struct MatchedUsersResponse: Codable {
    let success: Bool
    let message: String
    let data: UsersData
}

struct UsersData: Codable {
    let users: [UserProfile]
}

struct UserProfile: Codable {
    let id: String
    let name: String
    let avatar: String
    let bio: String
    let interests: [String]
    let score: Int
    let vectorScore: Int
    let aiScore: Int
    let reasoning: String
    let location: Location
    let personality: Personality
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, avatar, bio, interests, score
        case vectorScore, aiScore, reasoning
        case location, personality
    }
}

struct Location: Codable {
    let place: String
    let latitude: Double
    let longitude: Double
}

struct Personality: Codable {
    let spectrum: Int
    let balance: Int
    let focus: Int
}

// MARK: - Usage Example
class MatchViewModel: ObservableObject {
    @Published var matches: [Participant] = []
    @Published var isLoading = false
    @Published var error: String?
    
    private let service = MatchingService()
    private var cancellables = Set<AnyCancellable>()
    
    func findMatches() {
        guard let token = KeychainHelper.getToken() else {
            error = "Please log in first"
            return
        }
        
        isLoading = true
        
        service.findMatches(token: token)
            .sink(
                receiveCompletion: { [weak self] completion in
                    self?.isLoading = false
                    if case .failure(let err) = completion {
                        self?.error = err.localizedDescription
                    }
                },
                receiveValue: { [weak self] response in
                    self?.matches = response.data.participants
                }
            )
            .store(in: &cancellables)
    }
}
```

---

### Android (Kotlin + Retrofit)

```kotlin
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import okhttp3.OkHttpClient
import okhttp3.Interceptor

// MARK: - API Service
interface MatchingApiService {
    @GET("/user/match/findMatch")
    suspend fun findMatches(): MatchResponse
    
    @GET("/user/match/getAll")
    suspend fun getMatchedUsers(): MatchedUsersResponse
}

// MARK: - Data Classes
data class MatchResponse(
    val success: Boolean,
    val message: String,
    val data: PodcastData
)

data class PodcastData(
    @SerializedName("_id") val id: String,
    val primaryUser: String,
    val participants: List<Participant>,
    val status: String
)

data class Participant(
    val user: MatchedUser,
    val score: Int,
    val vectorScore: Int,
    val aiScore: Int,
    val reasoning: String,
    val isAllow: Boolean,
    val role: String
)

data class MatchedUser(
    @SerializedName("_id") val id: String,
    val name: String,
    val avatar: String
)

data class MatchedUsersResponse(
    val success: Boolean,
    val message: String,
    val data: UsersData
)

data class UsersData(
    val users: List<UserProfile>
)

data class UserProfile(
    @SerializedName("_id") val id: String,
    val name: String,
    val avatar: String,
    val bio: String,
    val interests: List<String>,
    val score: Int,
    val vectorScore: Int,
    val aiScore: Int,
    val reasoning: String,
    val location: Location,
    val personality: Personality
)

data class Location(
    val place: String,
    val latitude: Double,
    val longitude: Double
)

data class Personality(
    val spectrum: Int,
    val balance: Int,
    val focus: Int
)

// MARK: - Retrofit Setup
object RetrofitClient {
    private const val BASE_URL = "https://api.podlove.com"
    
    private fun getAuthInterceptor(token: String): Interceptor {
        return Interceptor { chain ->
            val request = chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Content-Type", "application/json")
                .build()
            chain.proceed(request)
        }
    }
    
    fun createService(token: String): MatchingApiService {
        val client = OkHttpClient.Builder()
            .addInterceptor(getAuthInterceptor(token))
            .build()
        
        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        
        return retrofit.create(MatchingApiService::class.java)
    }
}

// MARK: - Repository
class MatchingRepository(private val apiService: MatchingApiService) {
    suspend fun findMatches(): Result<MatchResponse> {
        return try {
            val response = apiService.findMatches()
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getMatchedUsers(): Result<MatchedUsersResponse> {
        return try {
            val response = apiService.getMatchedUsers()
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

// MARK: - ViewModel
class MatchViewModel(private val repository: MatchingRepository) : ViewModel() {
    private val _matches = MutableLiveData<List<Participant>>()
    val matches: LiveData<List<Participant>> = _matches
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    fun findMatches() {
        viewModelScope.launch {
            _isLoading.value = true
            
            repository.findMatches()
                .onSuccess { response ->
                    _matches.value = response.data.participants
                    _isLoading.value = false
                }
                .onFailure { exception ->
                    _error.value = exception.message
                    _isLoading.value = false
                }
        }
    }
}

// MARK: - Usage in Activity/Fragment
class MatchingActivity : AppCompatActivity() {
    private lateinit var viewModel: MatchViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val token = getTokenFromPreferences()
        val apiService = RetrofitClient.createService(token)
        val repository = MatchingRepository(apiService)
        viewModel = ViewModelProvider(
            this,
            MatchViewModelFactory(repository)
        )[MatchViewModel::class.java]
        
        observeViewModel()
        
        findViewById<Button>(R.id.btnFindMatches).setOnClickListener {
            viewModel.findMatches()
        }
    }
    
    private fun observeViewModel() {
        viewModel.matches.observe(this) { matches ->
            updateUI(matches)
        }
        
        viewModel.isLoading.observe(this) { isLoading ->
            showLoading(isLoading)
        }
        
        viewModel.error.observe(this) { error ->
            error?.let { showError(it) }
        }
    }
}
```

---

### cURL Examples

```bash
# 1. Login
curl -X POST https://api.podlove.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response: Save accessToken from response

# 2. Find New Matches
curl -X GET https://api.podlove.com/user/match/findMatch \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Get Existing Matches
curl -X GET https://api.podlove.com/user/match/getAll \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 4. Discover Users (Manual)
curl -X GET "https://api.podlove.com/user/discover?page=1&limit=10&gender=Female&minAge=25&maxAge=35" \
  -H "Content-Type: application/json"
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Cause | Solution |
|------|---------|-------|----------|
| `200` | Success | Request completed successfully | Parse response data |
| `400` | Bad Request | Invalid request format | Check request body/params |
| `401` | Unauthorized | Missing or invalid JWT token | Re-authenticate user |
| `403` | Forbidden | Insufficient permissions | Check user role/subscription |
| `404` | Not Found | User or podcast not found | Verify user ID exists |
| `409` | Conflict | User already has active podcast | Display appropriate message |
| `500` | Server Error | Backend error | Retry with exponential backoff |

### Error Response Format

```json
{
  "success": false,
  "message": "Error description here",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error information"
  }
}
```

### Specific Error Scenarios

#### 1. **No Authentication Token**

**Response:**
```json
{
  "success": false,
  "message": "User not authenticated",
  "statusCode": 401
}
```

**Mobile Handling:**
```swift
// Swift
if response.statusCode == 401 {
    // Clear stored token
    KeychainHelper.deleteToken()
    // Navigate to login screen
    navigationController?.pushViewController(LoginViewController(), animated: true)
}
```

#### 2. **Spotlight Quota Exhausted**

**Response:**
```json
{
  "success": false,
  "message": "Your Spotlight subscription has expired. Please renew to find matches.",
  "statusCode": 403
}
```

**Mobile Handling:**
```kotlin
// Kotlin
when (error.statusCode) {
    403 -> showUpgradeDialog("Spotlight Quota Exhausted", error.message)
}
```

#### 3. **No Matches Found**

**Response:**
```json
{
  "success": false,
  "message": "No suitable matches found at this time",
  "statusCode": 200,
  "data": {}
}
```

**Mobile Handling:**
```swift
// Swift
if response.data.participants.isEmpty {
    showEmptyState(
        title: "No Matches Yet",
        message: "Try adjusting your preferences or check back later"
    )
}
```

#### 4. **Incomplete Profile**

**Response:**
```json
{
  "success": false,
  "message": "Please complete your profile before matching",
  "statusCode": 400
}
```

**Mobile Handling:**
```kotlin
// Kotlin
if (!user.isProfileComplete) {
    navigateToProfileSetup()
}
```

#### 5. **User Already in Active Podcast**

**Response:**
```json
{
  "success": false,
  "message": "User already has a podcast not scheduled",
  "statusCode": 409
}
```

**Mobile Handling:**
```swift
// Swift
if response.statusCode == 409 {
    showAlert(
        title: "Active Podcast Found",
        message: "You already have an active podcast. Complete or cancel it before finding new matches."
    )
}
```

---

## Troubleshooting

### Issue 1: Empty Matches Returned

**Symptoms:**
- `/findMatch` returns empty participants array
- Response is successful but no matches

**Possible Causes:**

1. **Strict Preference Filters**
   - User's age/gender/distance preferences too narrow
   - No users in database matching criteria

   **Check:** `matchingConfig.ts` → `ENABLE_PREFERENCE_FILTERS`
   
   **Solution:**
   ```typescript
   // Temporarily disable filters for testing
   ENABLE_PREFERENCE_FILTERS = false
   
   // Or adjust fallback settings
   FALLBACK_STRATEGY = 'relax_filters'
   FALLBACK_THRESHOLD = 3
   FALLBACK_MAX_DISTANCE = 100
   ```

2. **All Users Already Matched**
   - `isPodcastActive: false` filter excludes all users
   
   **Check:**
   ```typescript
   PREFERENCE_FILTERS.IS_PODCAST_ACTIVE = false
   ```
   
   **Solution:** Set to `true` to exclude active users, or `false` to include them

3. **Location Data Missing**
   - User or candidate users missing `location.latitude`/`longitude`
   
   **Solution:** Ensure profile completion includes location

4. **Pinecone Vector Not Found**
   - User vector not yet upserted to Pinecone
   - Automatic fallback should activate
   
   **Verify:** Check logs for "No vector matches found, falling back to traditional matching"

---

### Issue 2: 401 Unauthorized Error

**Symptoms:**
- All API calls return 401
- Error: "User not authenticated"

**Possible Causes:**

1. **Expired JWT Token**
   - Token TTL exceeded (default: 7 days)
   
   **Solution:**
   ```swift
   // Swift: Implement token refresh
   if response.statusCode == 401 {
       refreshToken()
       // Retry original request
   }
   ```

2. **Missing Authorization Header**
   ```http
   # Wrong
   GET /user/match/findMatch
   
   # Correct
   GET /user/match/findMatch
   Authorization: Bearer eyJhbGc...
   ```

3. **Invalid Token Format**
   - Ensure "Bearer " prefix (with space)
   - No extra whitespace or characters

4. **User Deleted from Database**
   - Token valid but user record removed
   
   **Solution:** Force logout and re-authentication

---

### Issue 3: Slow Response Times

**Symptoms:**
- `/findMatch` takes > 30 seconds
- Timeout errors

**Possible Causes:**

1. **AI Compatibility Enabled**
   - GPT-4 calls add 2-5 seconds per candidate
   - 20 candidates = 40-100 seconds total
   
   **Check:** `matchingConfig.ts` → `ENABLE_AI_COMPATIBILITY`
   
   **Solution:**
   ```typescript
   // Disable for production
   ENABLE_AI_COMPATIBILITY = false
   
   // Or reduce candidates
   VECTOR_SEARCH_TOP_K = 10  // Instead of 20
   ```

2. **Pinecone Latency**
   - High network latency to Pinecone servers
   
   **Monitor:** Check Pinecone dashboard for performance metrics

3. **Large Database Queries**
   - Traditional matching with many users
   
   **Solution:** Add database indexes on frequently queried fields

---

### Issue 4: Inconsistent Match Scores

**Symptoms:**
- Same user pair shows different scores on different calls
- Scores fluctuate unexpectedly

**Possible Causes:**

1. **AI Temperature Too High**
   - Higher temperature = more randomness
   
   **Check:** `matchingConfig.ts` → `AI_TEMPERATURE`
   
   **Current:** `0.3` (deterministic)
   
   **Recommendation:** Keep at 0.2-0.3 for consistency

2. **Vector Embeddings Changed**
   - User updated profile/compatibility answers
   - Vector re-indexed with new data
   
   **Expected Behavior:** Scores should stabilize after 24 hours

3. **Fallback Strategy Activated**
   - Some calls use vector matching, others use traditional
   
   **Verify:** Check `vectorScore` field
   - If `vectorScore > 0`: Vector matching used
   - If `vectorScore === 0`: Traditional matching used

---

### Issue 5: Subscription Limits Not Applied

**Symptoms:**
- All users see same number of matches regardless of subscription
- Expected 10/20/40 matches, but getting 3

**Possible Causes:**

1. **Subscription Limits Disabled**
   
   **Check:** `matchingConfig.ts` → `ENABLE_SUBSCRIPTION_LIMITS`
   
   **Current:** `false` (all users get `DEFAULT_MATCH_COUNT`)
   
   **Solution:**
   ```typescript
   ENABLE_SUBSCRIPTION_LIMITS = true
   ```

2. **User Subscription Field Missing**
   - User object missing `subscription.plan`
   
   **Verify:**
   ```javascript
   // Check in MongoDB
   db.users.findOne({ _id: ObjectId("...") }, { subscription: 1 })
   ```

3. **Invalid Plan Name**
   - Plan must be "SAMPLER", "SEEKER", or "SCOUT" (exact case)
   
   **Solution:** Ensure subscription sync with Stripe webhooks

---

### Issue 6: Distance Filtering Not Working

**Symptoms:**
- Users outside specified distance appear in matches
- Distance preference ignored

**Possible Causes:**

1. **Distance Filter Disabled**
   
   **Check:**
   ```typescript
   ENABLE_PREFERENCE_FILTERS = true
   PREFERENCE_FILTERS.DISTANCE = true
   ```

2. **Fallback Strategy Activated**
   - Fallback expands distance to 100 miles
   
   **Verify:** Check if fewer than `FALLBACK_THRESHOLD` matches found

3. **Invalid Location Coordinates**
   - User or candidate missing `location.latitude`/`longitude`
   
   **Solution:** Validate location data during profile setup

---

### Debugging Checklist

When troubleshooting matching issues, check in this order:

```
✅ 1. User Authentication
   - Valid JWT token?
   - Token not expired?
   - User exists in database?

✅ 2. Profile Completeness
   - isProfileComplete === true?
   - Location data present?
   - Compatibility answers saved?

✅ 3. Configuration Settings
   - matchingConfig.ts values correct?
   - Filters enabled as intended?
   - Subscription limits configured?

✅ 4. External Services
   - MongoDB Atlas accessible?
   - Pinecone API responding?
   - OpenAI API key valid?

✅ 5. Database State
   - Sufficient users in database?
   - Users match preference criteria?
   - isPodcastActive flags correct?

✅ 6. Network & Performance
   - API response times acceptable?
   - No timeout errors?
   - Proper error handling in app?
```

---

## Best Practices

### ✅ Do's

1. **Cache Match Results Locally**
   - Store matches in local database/preferences
   - Reduce unnecessary API calls
   - Improve app responsiveness

2. **Implement Exponential Backoff**
   - Retry failed requests with increasing delays
   - Avoid overwhelming backend on errors

3. **Show Loading States**
   - AI matching takes time (5-15 seconds)
   - Use engaging animations
   - Display progress indicators

4. **Handle Edge Cases**
   - No matches found
   - Subscription expired
   - Network connectivity issues
   - Profile incomplete

5. **Monitor Analytics**
   - Track match success rates
   - Monitor API latency
   - Log error frequencies

6. **Secure Token Storage**
   - iOS: Use Keychain
   - Android: Use EncryptedSharedPreferences
   - Never store in plain text

7. **Validate Before Matching**
   - Check profile completeness
   - Verify subscription status
   - Ensure location permissions

### ❌ Don'ts

1. **Never Auto-Trigger Matching**
   - Don't call `/findMatch` on app launch
   - Don't poll for matches automatically
   - Requires explicit user action

2. **Don't Ignore Error Responses**
   - Always parse error messages
   - Display meaningful user feedback
   - Log errors for debugging

3. **Don't Cache Indefinitely**
   - Expire cached matches after 24 hours
   - Force refresh on user request
   - Update when profile changes

4. **Don't Expose Scores Insensitively**
   - Frame scores positively
   - Emphasize compatibility, not "rejection"
   - Use encouraging language

5. **Don't Hardcode Configuration**
   - Backend config can change
   - Use dynamic limits from API responses
   - Prepare for config variations

---

## API Rate Limits

### Current Limits

| Endpoint | Rate Limit | Window | Quota Impact |
|----------|------------|--------|--------------|
| `/auth/login` | 5 requests | 1 minute | None |
| `/user/match/findMatch` | 3 requests | 1 hour | -1 spotlight |
| `/user/match/getAll` | Unlimited | - | None |
| `/user/discover` | 100 requests | 1 hour | None |

### Recommendations

- Implement client-side throttling
- Show "Please wait" message if user spams match button
- Cache `/getAll` responses for at least 5 minutes

---

## Support & Resources

### Documentation
- **Main API Docs:** `podlove_matching_api_docs.md`
- **Mobile Integration Guide:** `mobile_matching_integration_guide.md`
- **README:** `README.md`

### Configuration Files
- **Matching Config:** `src/config/matchingConfig.ts`
- **Environment Variables:** `.env` (not in version control)

### Backend Endpoints
- **Base URL:** `https://api.podlove.com` (production)
- **Dev URL:** `http://localhost:8000` (development)

### Key Functions Reference

| Function | File | Purpose |
|----------|------|---------|
| `findMatch()` | `src/services/matchesServices.ts` | Main matching controller |
| `getMatchedUsers()` | `src/services/matchesServices.ts` | Retrieve existing matches |
| `findMatchesWithVectors()` | `src/services/matchesServices.ts` | Vector-based matching |
| `findMatchesTraditional()` | `src/services/matchesServices.ts` | Fallback matching |
| `subscriptionMatchCount()` | `src/services/matchesServices.ts` | Determine match limit |
| `getCompatibilityScoreWithReasoning()` | `src/services/matchesServices.ts` | AI compatibility analysis |

---

## Changelog

### v1.0 (January 2026)
- Initial documentation release
- Hybrid vector + AI matching system
- Configurable preference filters
- Subscription tier support
- Automatic fallback strategy

---

## Questions?

For technical support or questions about this API, contact:
- **Backend Team:** backend@podlove.com
- **Documentation Issues:** docs@podlove.com
- **Integration Support:** integration@podlove.com

---

**Happy Coding! 🚀**
