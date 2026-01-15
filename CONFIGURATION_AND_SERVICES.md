# Configuration and Services Documentation

## Table of Contents
1. [Overview](#overview)
2. [Environment Configuration](#environment-configuration)
3. [Hosting & Infrastructure](#hosting--infrastructure)
4. [Database Services](#database-services)
5. [AI & Machine Learning Services](#ai--machine-learning-services)
6. [Third-Party Services & APIs](#third-party-services--apis)
7. [Real-Time Communication](#real-time-communication)
8. [File Storage & Media](#file-storage--media)
9. [Payment Processing](#payment-processing)
10. [Authentication & Security](#authentication--security)
11. [Logging & Monitoring](#logging--monitoring)
12. [Development & Build](#development--build)

---

## Overview

**PodLove Backend** is a Node.js/Express TypeScript application that powers an AI-driven podcast matching platform. The app uses vector embeddings, semantic search, and GPT-based scoring to match users for podcast conversations based on compatibility.

### Architecture
- **Runtime**: Node.js v23.4.0
- **Framework**: Express.js v4.21.1
- **Language**: TypeScript v5.7.2
- **Package Manager**: pnpm v10.4.1

---

## Environment Configuration

### Required Environment Variables

#### Database
```env
ATLAS_URI=<MongoDB Atlas Connection String>
```

#### AI Services
```env
# OpenAI (GPT-4 & Embeddings)
OPENAI_API_KEY=<OpenAI API Key>
OPENAI_KEY=<OpenAI API Key - Alternative>

# Google Gemini AI
GEMINI_API_KEY=<Google Gemini API Key>

# Pinecone Vector Database
PINECONE_API_KEY=<Pinecone API Key>
PINECONE_INDEX_NAME=podlove-users
```

#### Payment Gateway
```env
STRIPE_SECRET_KEY=<Stripe Secret Key>
```

#### Cloud Storage (Cloudinary)
```env
CLOUD_NAME=<Cloudinary Cloud Name>
CLOUD_API_KEY=<Cloudinary API Key>
CLOUD_API_SECRET=<Cloudinary API Secret>
```

#### SMS & Phone Verification (Twilio)
```env
TWILIO_ACCOUNT_SID=<Twilio Account SID>
TWILIO_AUTH_TOKEN=<Twilio Auth Token>
TWILIO_PHONE_NUMBER=<Twilio Phone Number>
```

#### Email Service
```env
MAIL_HOST=<SMTP Host>
MAIL_USERNAME=<SMTP Username>
MAIL_PASSWORD=<SMTP Password>
SERVICE_EMAIL=<Sender Email Address>
SITE_DOMAIN=<Your Domain Name>
```

#### Real-Time Video (100ms Live)
```env
HMS_ACCESS_KEY=<100ms Live Access Key>
HMS_SECRET_KEY=<100ms Live Secret Key>
```

#### Authentication
```env
JWT_ACCESS_SECRET=<JWT Secret Key>
```

#### Server
```env
PORT=7000
NODE_ENV=production
```

---

## Hosting & Infrastructure

### Containerization
- **Docker**: Application is containerized using Docker
  - Base Image: `node:23.4.0`
  - Exposed Port: `7000`
  - Build Tool: `pnpm`
  - Entry Point: `pnpm start`

### Deployment Configuration
```dockerfile
FROM node:23.4.0
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 7000
CMD ["pnpm", "start"]
```

---

## Database Services

### 1. MongoDB Atlas
- **Purpose**: Primary database for user data, podcasts, subscriptions, analytics
- **Version**: Mongoose v8.21.0 (ODM)
- **Connection**: MongoDB Atlas Cloud
- **Configuration**: 
  - API Version: `1`
  - Strict Mode: Enabled
  - Deprecation Errors: Enabled

#### Collections
- Users (`userModel`)
- Podcasts (`podcastModel`)
- Authentication (`authModel`)
- Subscriptions (`subscriptionPlanModel`)
- Messages (`messageModel`)
- Notifications (`notificationModel`)
- Analytics (`analyticsModel`)
- Support Tickets (`supportModel`)
- Surveys (`surveyModel`)
- Admin (`adminModel`)
- Policies (Privacy, Consumer, Media)
- FAQs (`faqModel`)

---

## AI & Machine Learning Services

### 1. OpenAI GPT-4
- **Purpose**: AI-powered compatibility scoring and content generation
- **Model**: `gpt-4o`
- **Package**: `openai` v4.83.0
- **Use Cases**:
  - Calculate user compatibility scores (0-100)
  - Analyze user responses to compatibility questions
  - Generate personalized matching recommendations
  - AI conversation analysis

### 2. OpenAI Embeddings
- **Purpose**: Generate semantic vector embeddings for user profiles
- **Model**: `text-embedding-3-large`
- **Dimensions**: 1024
- **Embedding Types**:
  - **Profile Embeddings**: Bio, interests, personality, background
  - **Preference Embeddings**: Desired gender, age range, body type
  - **Compatibility Embeddings**: Survey responses, values, lifestyle

### 3. Google Gemini AI
- **Purpose**: Alternative AI model for content generation
- **Package**: `@google/generative-ai` v0.24.1
- **Configuration**:
  - Harm Category Blocking
  - Safety Settings
  - Custom Generation Config

### 4. Pinecone Vector Database
- **Purpose**: Semantic search and similarity matching
- **Package**: `@pinecone-database/pinecone` v5.1.2
- **Configuration**:
  - Index Name: `podlove-users`
  - Dimension: 1024
  - Metric: Cosine similarity
  - Spec: Serverless (AWS us-east-1)

#### Pinecone Features
- Store user embeddings (profile, preference, compatibility)
- Vector similarity search
- Metadata filtering (age, gender, location, etc.)
- Real-time vector upserts
- Automatic podcast status updates

#### Scripts
```bash
# Migrate users to Pinecone
pnpm run migrate

# Match a specific user
pnpm run matching

# Fix age data in Pinecone
pnpm run fix-ages
```

---

## Third-Party Services & APIs

### 1. Twilio
- **Purpose**: SMS and phone verification
- **Package**: `twilio` v5.4.3
- **Features**:
  - Send OTP verification codes
  - Phone number validation
  - SMS notifications

### 2. Stripe
- **Purpose**: Payment processing and subscription management
- **Package**: `stripe` v17.4.0
- **Features**:
  - Subscription checkout sessions
  - Customer management
  - Webhook event handling
  - Payment method management

### 3. 100ms Live (HMS)
- **Purpose**: Real-time video and audio for podcast rooms
- **Package**: `@100mslive/server-sdk` v0.3.0
- **Features**:
  - Generate management tokens
  - Video/audio room creation
  - Live streaming capabilities

### 4. Cloudinary
- **Purpose**: Media storage and CDN
- **Package**: `cloudinary` v2.5.1
- **Supported Formats**:
  - Images
  - Audio recordings
  - Video files
- **Features**:
  - Automatic format detection
  - Secure URL generation
  - File deletion
  - Folder organization

### 5. AWS S3 (Optional)
- **Purpose**: Alternative file storage
- **Packages**:
  - `@aws-sdk/client-s3` v3.886.0
  - `@aws-sdk/s3-request-presigner` v3.888.0

---

## Real-Time Communication

### Socket.IO
- **Purpose**: Real-time chat and notifications
- **Package**: `socket.io` v4.8.1
- **Configuration**:
  - CORS: Origin `*`
  - Integrated with Express HTTP server
- **Features**:
  - Real-time messaging
  - User presence detection
  - Event-based communication
  - Room-based conversations

---

## File Storage & Media

### Upload Handling
- **Package**: `express-fileupload` v1.5.1 & `multer` v2.0.1
- **Storage Locations**:
  - Images: `uploads/images/`
  - Recordings: `uploads/recordings/`

### Media Processing
- **Package**: `fluent-ffmpeg` v2.1.3
- **Purpose**: Audio/video processing and transcoding

---

## Payment Processing

### Stripe Integration
- **Subscription Plans**:
  - **Sampler**: 20 matches (Free tier)
  - **Seeker**: 30 matches (Mid tier)
  - **Scout**: 40 matches (Premium tier)

- **Features**:
  - Subscription creation and management
  - Webhook event handling
  - Customer profile management
  - Payment method storage

---

## Authentication & Security

### JWT Authentication
- **Package**: `jsonwebtoken` v9.0.2, `jwks-rsa` v3.2.0
- **Token Types**:
  - Access tokens (short-lived)
  - Refresh tokens (long-lived)
- **Security Features**:
  - Bearer token authentication
  - Role-based access control (User/Admin)
  - Token verification and decoding

### Password Security
- **Package**: `bcrypt` v5.1.1
- **Features**:
  - Password hashing
  - Salt generation
  - Secure password comparison

### CORS
- **Package**: `cors` v2.8.5
- **Configuration**:
  - Origin: `*` (configurable)
  - Methods: GET, POST, PUT, PATCH, DELETE
  - Credentials: Enabled

---

## Logging & Monitoring

### Winston Logger
- **Package**: `winston` v3.17.0, `winston-daily-rotate-file` v5.0.0
- **Log Types**:
  - Success logs: `logs/winston/successes/`
  - Error logs: `logs/winston/errors/`
- **Features**:
  - Daily log rotation
  - Formatted log output
  - Multiple transport channels
  - Timestamp and level tracking

---

## Development & Build

### Scripts
```json
{
  "start": "node dist/server.js",
  "build": "tsc && tsc-alias",
  "dev": "nodemon -r tsconfig-paths/register src/server.ts",
  "migrate": "ts-node -r tsconfig-paths/register src/scripts/migrateToPinecone.ts",
  "matching": "ts-node -r tsconfig-paths/register src/scripts/matchUser.ts",
  "fix-ages": "ts-node -r tsconfig-paths/register src/scripts/fixPineconeAges.ts"
}
```

### TypeScript Configuration
- **Compiler**: TypeScript v5.7.2
- **Path Mapping**: `tsconfig-paths` v4.2.0
- **Path Aliases**: `tsc-alias` v1.8.10
- **Runtime**: `ts-node` v10.9.2

### Development Tools
- **Hot Reload**: `nodemon` v3.1.7
- **Type Definitions**: Full TypeScript support with @types packages

---

## Matching System Configuration

### AI Matching Logic
The matching system uses a hybrid approach:

1. **Vector Search** (Pinecone): Semantic similarity using embeddings
2. **AI Scoring** (OpenAI GPT): Deep compatibility analysis
3. **Preference Filters**: User-defined matching criteria
4. **Subscription Limits**: Tier-based match counts

### Configuration Toggles (`matchingConfig.ts`)

#### Filter Switches
- `ENABLE_PREFERENCE_FILTERS`: Enable/disable all preference filtering
- Individual filters: Gender, Age, Body Type, Ethnicity, Distance
- `ENABLE_SUBSCRIPTION_LIMITS`: Tier-based match count limits
- `ENABLE_SPOTLIGHT_QUOTA`: Match quota enforcement

#### Match Counts
- Default: 2 matches (when limits disabled)
- Sampler: 20 matches
- Seeker: 30 matches
- Scout: 40 matches

### Automated Scheduling
- **Cron Jobs**: `node-cron` v4.2.1 & `cron` v4.3.2
- **Frequency**: Every minute (`*/1 * * * *`)
- **Purpose**: Automatically create podcast matches for eligible users

---

## Utilities & Helper Libraries

### General Utilities
- **Error Handling**: `http-errors` v2.0.0, `await-to-ts` v1.0.6
- **Status Codes**: `http-status-codes` v2.3.0
- **Date/Time**: `luxon` v3.7.1
- **UUID Generation**: `uuid` v11.0.4
- **Async Control**: `p-limit` v6.2.0
- **HTTP Requests**: `node-fetch` v3.3.2

### Email Service (Nodemailer)
- **Package**: `nodemailer` v6.9.16
- **Features**:
  - SMTP email delivery
  - HTML templates
  - Support notifications

---

## API Documentation

Detailed API documentation is available in:
- [Podlove Matching API Docs](podlove_matching_api_docs.md)
- [Mobile Matching Integration Guide](mobile_matching_integration_guide.md)

---

## Setup Instructions

### Prerequisites
- Node.js v23.4.0 or higher
- pnpm v10.4.1 or higher
- MongoDB Atlas account
- OpenAI API key
- Pinecone account
- Cloudinary account
- Stripe account
- Twilio account (for SMS)
- 100ms Live account (for video)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd podlove_backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   - Create a `.env` file in the root directory
   - Add all required environment variables (see [Environment Configuration](#environment-configuration))

4. **Build the application**
   ```bash
   pnpm build
   ```

5. **Run migrations** (optional)
   ```bash
   pnpm run migrate
   ```

6. **Start the server**
   ```bash
   # Production
   pnpm start
   
   # Development
   pnpm dev
   ```

### Docker Deployment

```bash
# Build the Docker image
docker build -t podlove-backend .

# Run the container
docker run -p 7000:7000 --env-file .env podlove-backend
```

---

## Service Dependencies Summary

| Service | Purpose | Package/Version |
|---------|---------|-----------------|
| MongoDB Atlas | Primary Database | mongoose v8.21.0 |
| OpenAI GPT-4 | AI Scoring | openai v4.83.0 |
| OpenAI Embeddings | Vector Generation | openai v4.83.0 |
| Pinecone | Vector Search | @pinecone-database/pinecone v5.1.2 |
| Google Gemini | Alternative AI | @google/generative-ai v0.24.1 |
| Stripe | Payments | stripe v17.4.0 |
| Cloudinary | Media Storage | cloudinary v2.5.1 |
| Twilio | SMS Verification | twilio v5.4.3 |
| 100ms Live | Video/Audio | @100mslive/server-sdk v0.3.0 |
| Socket.IO | Real-time Chat | socket.io v4.8.1 |
| JWT | Authentication | jsonwebtoken v9.0.7 |
| Winston | Logging | winston v3.17.0 |
| AWS S3 | File Storage (Optional) | @aws-sdk/client-s3 v3.886.0 |

---

## Support

For questions or issues:
- Email: support@podlove.co
- Review the API documentation files in this repository

---

*Last Updated: January 15, 2026*
