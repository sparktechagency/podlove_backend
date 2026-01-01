# Podlove Backend API

## 🎯 Overview

Podlove Backend is a Node.js/TypeScript-based REST API that powers the Podlove dating platform. The system features AI-powered matching using vector similarity search, real-time chat, podcast scheduling, and subscription management.

---

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Vector Database**: Pinecone (for AI matching)
- **AI/ML**: OpenAI (GPT-4, Embeddings)
- **Authentication**: JWT with jwks-rsa
- **Payment Processing**: Stripe
- **Real-time Communication**: Socket.io
- **File Storage**: AWS S3, Cloudinary
- **Video**: 100ms SDK
- **SMS**: Twilio
- **Email**: Nodemailer
- **Logging**: Winston

---

## 📁 Project Structure

```
podlove_backend/
├── src/
│   ├── app.ts                    # Express app configuration
│   ├── server.ts                 # Server entry point
│   ├── connection/
│   │   ├── atlasDB.ts           # MongoDB Atlas connection
│   │   └── db.ts                # Database utilities
│   ├── controllers/             # Request handlers
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── podcastController.ts
│   │   ├── chatController.ts
│   │   └── ...
│   ├── services/                # Business logic
│   │   ├── embeddingService.ts  # OpenAI embeddings generation
│   │   ├── vectorService.ts     # Pinecone vector operations
│   │   ├── matchesServices.ts   # AI-powered matching
│   │   ├── stripeServices.ts    # Payment processing
│   │   └── ...
│   ├── models/                  # MongoDB schemas
│   │   ├── userModel.ts
│   │   ├── podcastModel.ts
│   │   ├── chatModel.ts
│   │   └── ...
│   ├── routers/                 # API route definitions
│   │   └── ...
│   ├── middlewares/             # Express middlewares
│   │   ├── authorization.ts     # JWT verification
│   │   ├── errorHandler.ts      # Global error handling
│   │   └── fileHandler.ts       # File upload handling
│   ├── utils/                   # Helper functions
│   │   ├── ageUtils.ts
│   │   ├── calculateDistanceUtils.ts
│   │   ├── vectorSyncUtils.ts
│   │   └── ...
│   ├── schemas/                 # Validation schemas
│   └── shared/                  # Shared types/enums
├── logs/                        # Winston logs
│   └── winston/
│       ├── errors/
│       └── successes/
├── uploads/                     # Temporary file storage
│   ├── images/
│   └── recordings/
├── Dockerfile                   # Docker configuration
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB Atlas account (or local MongoDB)
- Pinecone account (for vector matching)
- OpenAI API key
- Stripe account (for payments)
- AWS S3 bucket (for file storage)
- Twilio account (for SMS)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd podlove/podlove_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `podlove_backend` directory:
   
   ```bash
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # MongoDB
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/podlove
   
   # JWT Authentication
   JWKS_URI=https://your-auth-provider.com/.well-known/jwks.json
   JWT_SECRET=your_jwt_secret_key_here
   
   # OpenAI (AI Matching & Embeddings)
   OPENAI_KEY=sk-your-openai-api-key
   
   # Pinecone (Vector Database)
   PINECONE_API_KEY=your-pinecone-api-key
   PINECONE_INDEX_NAME=podlove-users
   
   # Stripe (Payment Processing)
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   
   # AWS S3 (File Storage)
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   AWS_BUCKET_NAME=podlove-uploads
   
   # Cloudinary (Image Storage)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Twilio (SMS)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   
   # Email
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_email_password
   
   # 100ms (Video Calls)
   HMS_APP_ACCESS_KEY=your_100ms_access_key
   HMS_APP_SECRET=your_100ms_secret
   
   # Frontend URL (CORS)
   FRONTEND_URL=http://localhost:5173
   ```

4. **Initialize Pinecone vector database**
   ```bash
   npx ts-node ../script/migrateToPinecone.ts
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The server will start on `http://localhost:5000`

---

## 📝 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Run tests (if configured)
npm test
```

---

## 🔑 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `OPENAI_KEY` | OpenAI API key for embeddings & GPT | `sk-...` |
| `PINECONE_API_KEY` | Pinecone API key for vector search | `pcsk_...` |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | `sk_test_...` |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 | `AKIA...` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID for SMS | `AC...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `PINECONE_INDEX_NAME` | Pinecone index name | `podlove-users` |

---

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. User authenticates via OAuth provider
2. Backend validates JWT using JWKS
3. Token contains user claims (userId, email, etc.)
4. Protected routes require `Authorization: Bearer <token>` header

**Example authenticated request:**
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # User login
POST   /api/auth/verify-phone      # Verify phone number
POST   /api/auth/refresh           # Refresh JWT token
```

### User Management
```
GET    /api/users/profile          # Get current user profile
PUT    /api/users/profile          # Update user profile
PUT    /api/users/preferences      # Update matching preferences
POST   /api/users/avatar           # Upload profile picture
DELETE /api/users/account          # Delete user account
```

### Matching System
```
POST   /api/matches/find           # Find compatible matches (AI-powered)
GET    /api/matches                # Get matched users
POST   /api/matches/feedback       # Submit match feedback
```

### Podcast Management
```
POST   /api/podcasts               # Create podcast session
GET    /api/podcasts/:id           # Get podcast details
PUT    /api/podcasts/:id/schedule  # Schedule podcast
DELETE /api/podcasts/:id           # Delete podcast
GET    /api/podcasts/user          # Get user's podcasts
```

### Chat
```
GET    /api/chats                  # Get all user chats
GET    /api/chats/:chatId/messages # Get chat messages
POST   /api/chats/:chatId/messages # Send message
PUT    /api/chats/:chatId/read     # Mark as read
```

### Subscriptions
```
GET    /api/subscriptions/plans    # Get subscription plans
POST   /api/subscriptions/checkout # Create Stripe checkout
POST   /api/subscriptions/webhook  # Stripe webhook handler
GET    /api/subscriptions/status   # Get subscription status
```

### Admin
```
GET    /api/admin/users            # Get all users
GET    /api/admin/analytics        # Platform analytics
PUT    /api/admin/users/:id/ban    # Ban user
```

---

## 🤖 AI-Powered Matching System

### How It Works

1. **Profile Embedding**
   - User profile (bio, interests, compatibility answers) → OpenAI embedding (1024-dim vector)
   - Stored in Pinecone for fast similarity search

2. **Vector Search**
   - Query Pinecone with user's embedding
   - Get top 15 semantically similar users
   - Filter by metadata (age, gender, location, preferences)

3. **AI Compatibility Scoring**
   - GPT-4 analyzes both profiles
   - Returns compatibility score (0-100) + reasoning
   - Runs in parallel for all candidates

4. **Weighted Final Score**
   ```
   Final Score = (Vector Similarity × 40%) + (AI Compatibility × 60%)
   ```

5. **Return Top Matches**
   - Sorted by final score
   - Limited by subscription tier (2-4 matches)

### Subscription Tiers

| Tier | Matches | Spotlight |
|------|---------|-----------|
| SAMPLER | 2 | 2 |
| SEEKER | 3 | 2 |
| SCOUT | 4 | 3 |

**For detailed architecture**, see: [VECTOR_MATCHING_ARCHITECTURE.md](../VECTOR_MATCHING_ARCHITECTURE.md)

---

## 💾 Database Schema

### User Model
```typescript
{
  auth: ObjectId,              // Reference to Auth document
  name: string,
  email: string,
  phoneNumber: string,
  dateOfBirth: string,
  gender: string,
  bodyType: string,
  ethnicity: string[],
  bio: string,
  personality: {
    spectrum: number,          // 1-7 (Introverted to Extroverted)
    balance: number,           // 1-7 (Logical to Emotional)
    focus: number              // 1-7 (Relaxed to Goal-oriented)
  },
  interests: string[],
  avatar: string,
  compatibility: string[],     // 40 compatibility questions
  location: {
    place: string,
    latitude: number,
    longitude: number
  },
  preferences: {
    gender: string[],
    age: { min: number, max: number },
    bodyType: string[],
    ethnicity: string[],
    distance: number           // in miles
  },
  subscription: {
    plan: string,              // SAMPLER, SEEKER, SCOUT
    status: string,            // PAID, FAILED, CANCELLED
    isSpotlight: number,       // Remaining spotlight sessions
    startedAt: Date
  },
  isPodcastActive: boolean,
  isProfileComplete: boolean
}
```

### Podcast Model
```typescript
{
  primaryUser: ObjectId,
  participants: [{
    user: ObjectId,
    score: number,             // Compatibility score
    isQuestionAnswer: string
  }],
  status: string,              // NotScheduled, Scheduled, Completed
  scheduledDate: Date,
  meetingLink: string,
  recordingUrl: string
}
```

### Chat Model
```typescript
{
  participants: ObjectId[],
  lastMessage: {
    text: string,
    sender: ObjectId,
    timestamp: Date
  },
  unreadCount: Map
}
```

---

## 🧪 Testing

### Run Tests
```bash
# Vector matching system test
npx ts-node ../script/testVectorMatching.ts

# API endpoint tests (if configured)
npm test
```

### Manual API Testing

Use Postman or cURL:

```bash
# Get user profile
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Find matches
curl -X POST http://localhost:5000/api/matches/find \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t podlove-backend .
```

### Run Container
```bash
docker run -p 5000:5000 \
  --env-file .env \
  podlove-backend
```

### Docker Compose (with MongoDB)
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "5000:5000"
    env_file:
      - .env
    depends_on:
      - mongodb
  
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

---

## 🚀 Production Deployment

### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create podlove-backend

# Set environment variables
heroku config:set MONGO_URI=your_mongo_uri
heroku config:set OPENAI_KEY=your_openai_key
heroku config:set PINECONE_API_KEY=your_pinecone_key
# ... set all other env vars

# Deploy
git push heroku main

# Run migrations
heroku run "npx ts-node script/migrateToPinecone.ts"

# View logs
heroku logs --tail
```

### AWS EC2 / DigitalOcean

1. **Setup server**
   ```bash
   ssh user@your-server-ip
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd podlove/podlove_backend
   npm install
   ```

3. **Configure environment**
   ```bash
   nano .env
   # Add all environment variables
   ```

4. **Build and start**
   ```bash
   npm run build
   pm2 start dist/server.js --name podlove-backend
   pm2 startup
   pm2 save
   ```

5. **Setup Nginx reverse proxy**
   ```nginx
   server {
       listen 80;
       server_name api.podlove.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 📊 Monitoring & Logging

### Winston Logs

Logs are stored in `logs/winston/`:
- **Success logs**: `logs/winston/successes/`
- **Error logs**: `logs/winston/errors/`

### View Logs
```bash
# View recent errors
tail -f logs/winston/errors/*.log

# View success logs
tail -f logs/winston/successes/*.log
```

### Health Check Endpoint
```bash
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-30T10:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "pinecone": "connected"
}
```

---

## 🔧 Troubleshooting

### Common Issues

**1. MongoDB connection fails**
```bash
# Check connection string
echo $MONGO_URI

# Test connection
mongosh "$MONGO_URI"
```

**2. Pinecone errors**
```bash
# Verify API key
echo $PINECONE_API_KEY

# Check index exists
npx ts-node -e "import { getIndexStats } from './src/services/vectorService'; getIndexStats().then(console.log);"
```

**3. OpenAI rate limits**
- Reduce batch size in embedding generation
- Add delays between requests
- Upgrade OpenAI plan

**4. Port already in use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

**5. TypeScript compilation errors**
```bash
# Clean build
rm -rf dist/
npm run build
```

---

## 📚 Additional Resources

- [Vector Matching Architecture](../VECTOR_MATCHING_ARCHITECTURE.md)
- [Quick Start Guide](../VECTOR_MATCHING_QUICKSTART.md)
- [API Documentation](./API_DOCUMENTATION.md) *(if exists)*
- [Database Schema](./DATABASE_SCHEMA.md) *(if exists)*

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Write descriptive commit messages
- Add comments for complex logic
- Update documentation

---

## 📄 License

This project is proprietary and confidential.

---

## 📞 Support

- **Email**: backend@podlove.com
- **Slack**: #backend-support
- **Issues**: [GitHub Issues](https://github.com/your-org/podlove/issues)

---

**Last Updated**: December 30, 2025  
**Version**: 2.0.0 (Vector Matching Enabled)
