# Mobile Integration Guide: PodLove Matching System

This guide explains how to integrate the PodLove matching system into iOS and Android applications using the existing Node.js backend APIs.

## 1. Authentication
All matching endpoints require a valid JWT token.
- **Header**: `Authorization: Bearer <your_token>`

## 2. Core Matching Endpoints

### A. Trigger & Find Matches
This endpoint runs the AI and Vector-based matching algorithm for the authenticated user and creates a podcast entry with the resulting participants.

- **URL**: `/user/match/findMatch`
- **Method**: `GET`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User successfully updated matches for the podcast",
    "data": {
      "_id": "podcast_id",
      "primaryUser": "your_user_id",
      "participants": [
        {
          "user": {
            "_id": "matched_user_id",
            "name": "User Name",
            "avatar": "avatar_url"
          },
          "score": 85,
          "aiScore": 80,
          "vectorScore": 90,
          "reasoning": "Matching values and communication style..."
        }
      ],
      "status": "NotScheduled"
    }
  }
  ```

### B. Retrieve Existing Matches
Use this to get the list of users already matched with the current user, including full profile details and compatibility reasoning.

- **URL**: `/user/match/getAll`
- **Method**: `GET`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Matched users retrieved successfully",
    "data": {
      "users": [
        {
          "_id": "matched_user_id",
          "name": "User Name",
          "avatar": "avatar_url",
          "bio": "User bio...",
          "interests": ["Music", "Travel"],
          "personality": { ... },
          "score": 85,
          "aiScore": 80,
          "vectorScore": 90,
          "reasoning": "Detailed compatibility analysis..."
        }
      ]
    }
  }
  ```

### C. Initiate Connection (Optional/Future)
The system uses a `POST` request to start a connection pathway with a specific matched user.

- **URL**: `/user/match/:id` (where `:id` is the matched user's ID)
- **Method**: `POST`

---

## 3. Implementation Process

### Step 1: User Profile Completeness
Ensure the user has completed their profile (bio, interests, compatibility questions) before triggering matches. The backend uses these fields for vector embeddings and AI analysis.
- **Relevant Fields**: `bio`, `interests`, `compatibility` (array of answers), `location` (lat/long).

### Step 2: Triggering the Matching Logic
When the user navigates to the "Find Match" screen:
1. Show a loading indicator (e.g., "AI is analyzing profiles...").
2. Call `GET /user/match/findMatch`.
3. On success, store the `participants` array.

### Step 3: Displaying Match Cards
For each participant in the response:
- **Profile Image**: `user.avatar`
- **Display Name**: `user.name`
- **Compatibility Badge**: Display `{score}%` as the "Matching Score".
- **Reasoning Snippet**: Show the `reasoning` text (AI-generated compatibility analysis).

### Step 4: Viewing Profile & Connection
When a user clicks on a match:
1. Navigate to a Detail Screen using the `user._id`.
2. Use the data from `GET /user/match/getAll` to populate the detail screen (bio, interests, etc.).

---

## 4. Best Practices for Mobile

1. **Polling vs. One-time trigger**: The `findMatch` endpoint is heavy as it calls OpenAI and Pinecone. Only call it when the user explicitly requests new matches or upon first entry to the matching section.
2. **Error Handling**: 
   - **404**: No matches found. Suggest user to update their preferences or bio.
   - **401**: Token expired. Redirect to login.
3. **Caching**: Store match results locally after retrieval to avoid redundant backend calls, but allow the user to "Refresh" which would call `findMatch` again.
4. **UX**: Use shimmering effects or AI-themed animations while `findMatch` is processing to provide a premium feel.

---

## 5. Platform Specific Implementation (Examples)

### Android (Kotlin + Retrofit)
```kotlin
interface PodLoveApiService {
    @GET("user/match/findMatch")
    suspend fun findMatches(): Response<MatchResponse>
    
    @GET("user/match/getAll")
    suspend fun getExistingMatches(): Response<AllMatchesResponse>
}

// In ViewModel
viewModelScope.launch {
    val result = repository.findMatches()
    if (result.isSuccessful) {
        _matches.value = result.body()?.data?.participants
    }
}
```

### iOS (Swift + Combine/Async-Await)
```swift
func findMatches() async throws -> MatchResponse {
    let url = URL(string: "https://api.podlove.com/user/match/findMatch")!
    var request = URLRequest(url: url)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    
    let (data, response) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode(MatchResponse.self, from: data)
}
```

---

## 6. Important Notes
- **Score Calculation**: The `score` field is a weighted combination of Vector similarity (80%) and AI compatibility (20%) as per `matchingConfig.ts`. Always use this field for the primary progress bar/percentage.
- **Reasoning**: If `INCLUDE_REASONING_IN_RESPONSE` is enabled in the backend, the `reasoning` field will contain a string that you can display as "AI's Insight".

