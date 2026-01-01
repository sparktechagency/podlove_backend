# PodLove Matching API Documentation

This document provide technical details for implementing the matching system through the PodLove Backend API.

## 1. Server Configuration
- **Default Port**: `8000`
- **Base URL**: `http://<server-ip>:8000` (e.g., `http://localhost:8000`)
- **Protocol**: HTTP/1.1
- **Content-Type**: `application/json`

## 2. Authentication
All matching endpoints are protected and require a valid JWT token.

### Login (Obtain Token)
- **Endpoint**: `/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```
- **Response**: The token is returned as `accessToken` inside the `data` object.
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbG...",
      "user": { "_id": "...", "name": "..." }
    }
  }
  ```

## 3. Matching & Discovery Endpoints

### A. AI-Powered Matching (The "Find Match" Algorithm)
This endpoint triggers the full matching algorithm. It ensures the user's vector is updated in Pinecone, performs a similarity search, and then runs OpenAI GPT-4o analysis on the results.

- **Endpoint**: `/user/match/findMatch`
- **Method**: `GET`
- **Headers**:
  - `Authorization: Bearer <accessToken>`
- **Behavior**: Updates the user's active podcast session with 3-4 top matches.
- **Success Response**: Returns a Podcast object with a `participants` array. Each participant has `score`, `aiScore`, `vectorScore`, and `reasoning`.

### B. Retrieve Matched User Profiles
Retrieves complete profile data for all users currently matched with the requester.

- **Endpoint**: `/user/match/getAll`
- **Method**: `GET`
- **Headers**:
  - `Authorization: Bearer <accessToken>`
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "users": [
        {
          "_id": "user_id",
          "name": "User Name",
          "avatar": "url",
          "bio": "...",
          "interests": [],
          "score": 85,
          "reasoning": "Matching personality focus..."
        }
      ]
    }
  }
  ```

### C. Manual User Discovery (Search & Filter)
If the mobile app needs a manual search or discovery feature, use this endpoint. It supports various filters but does not run the AI compatibility logic (only basic database filtering).

- **Endpoint**: `/user/get-all-users`
- **Method**: `GET`
- **Query Parameters**:
  - `search`: String (name search)
  - `minAge` / `maxAge`: Numbers
  - `gender`: String (e.g., `Male,Female`)
  - `bodyType`: String
  - `ethnicity`: String
  - `page` / `limit`: For pagination
- **Success Response**: Returns a paginated list of users.

## 5. Environment Requirements
To host this API, the following environment variables must be configured on the server:
- `PORT`: Server port (default 8000)
- `MONGODB_URI`: Connection string for Atlas/Local MongoDB
- `OPENAI_KEY`: API Key for GPT-4o compatibility analysis
- `PINECONE_API_KEY`: API Key for Vector Database
- `PINECONE_INDEX_NAME`: Name of the Pinecone index (e.g., `podlove-users`)

## 6. Logic Configuration
Match quality and behavior can be adjusted in `src/config/matchingConfig.ts`:
- `DEFAULT_MATCH_COUNT`: Number of matches returned.
- `SCORE_WEIGHTS`: Balance between Vector (semantic) and AI (personality) scores.
- `ENABLE_AI_COMPATIBILITY`: Toggle GPT analysis on/off.
