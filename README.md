# Podlove Backend API

This document provides an overview of the routing structure and core file organization for the Podlove Backend API.

## API Routers

The following routers define the various endpoints and functionalities available in this API, along with their primary base paths:

*   **`adminRouter.ts`**: Mounted at `/admin` - Manages administrative functionalities and endpoints, including user management, content moderation, and system settings.
*   **`aiRouter.ts`**: Mounted at `/ai` - Handles routes related to Artificial Intelligence features, such as content generation or data analysis.
*   **`analyticsRouter.ts`**: Mounted at `/analytics` - Provides endpoints for fetching and managing analytics data, offering insights into application usage and performance.
*   **`authRouter.ts`**: Mounted at `/auth` - Manages user authentication, registration, and authorization flows, including login, logout, and token management.
*   **`chatRouter.ts`**: Mounted at `/chat` - Handles routes for real-time chat and messaging features between users.
*   **`consumerPolicyRouter.ts`**: Mounted at `/consumer` - Defines routes for consumer-related policies and agreements, such as terms of service or privacy notices for end-users.
*   **`faqRouter.ts`**: Mounted at `/faq` - Provides endpoints for Frequently Asked Questions (FAQ) content, allowing users to find answers to common queries.
*   **`homeRouter.ts`**: Mounted at `/home` - Manages general application routes, typically for the home or landing page, providing initial content and navigation.
*   **`mediaPolicyRouter.ts`**: Mounted at `/media` - Handles routes related to media content policies, including usage guidelines and content restrictions.
*   **`notificationRouter.ts`**: Mounted at `/notification` - Manages user notifications and related settings, allowing users to receive and manage alerts.
*   **`podcastRouter.ts`**: Mounted at `/podcast` - Handles all operations related to podcasts (creation, retrieval, updates, deletion, etc.), including episode management.
*   **`privacyRouter.ts`**: Mounted at `/privacy` - Provides endpoints for privacy policies and user privacy settings, ensuring compliance and user control over data.
*   **`subscriptionPlanRouter.ts`**: Mounted at `/subscription-plan` - Manages specific subscription plan details and operations, such as plan creation, updates, and user assignments.
    *   *Note: `planRouter.ts` exists in the `src/routers` directory but is not explicitly mounted in `app.ts`; `SubscriptionPlanRouter` is used instead.*
*   **`subscriptionRouter.ts`**: Mounted at `/subscription` - Handles general subscription management and status, including user subscriptions and billing cycles.
*   **`supportRouter.ts`**: Mounted at `/support` - Defines routes for customer support functionalities and requests, enabling users to get assistance.
*   **`surveyRouter.ts`**: Mounted at `/survey` - Provides endpoints for creating, managing, and responding to surveys, facilitating user feedback.
*   **`tacRouter.ts`**: Mounted at `/tac` - Handles routes for Terms and Conditions (TAC) content, outlining the legal agreements for users.
*   **`userRouter.ts`**: Mounted at `/user` - Manages user profiles, settings, and other user-specific data.
*   **`webhookRouter.ts`**: Mounted at `/` (root path) - Defines endpoints for receiving and processing webhook events from external services.

## File Structure Overview

The `src/` directory is organized into several key modules, each serving a distinct purpose within the application:

*   **`src/app.ts`**: The main Express application file. It's responsible for setting up global middleware (e.g., JSON parsing, CORS), importing and mounting all API routers, and configuring global error handling.
*   **`src/server.ts`**: The entry point for the Node.js server. It initializes the application, connects to the database, and starts listening for incoming requests.
*   **`src/config/`**: Contains configuration files for various aspects of the application, such as database settings, API keys, or application-specific constants (e.g., `matchingConfig.ts`).
*   **`src/connection/`**: Manages database connections (e.g., to MongoDB Atlas) and ensures a stable link between the application and its data store.
*   **`src/controllers/`**: Houses the request handling logic. Controllers receive incoming requests from routes, interact with services, and send appropriate responses back to the client.
*   **`src/middlewares/`**: Stores custom Express middleware functions. These functions perform actions like authentication, authorization, error handling, and file processing (`errorHandler.ts`, `authorization.ts`).
*   **`src/models/`**: Defines Mongoose (or similar ORM) schemas and models. These files represent the structure of data stored in the database and provide an interface for data interaction.
*   **`src/podcast/`**: A module specifically dedicated to podcast-related functionalities, potentially containing its own controllers, services, helpers, and interfaces to manage podcast data and operations.
*   **`src/routers/`**: This directory contains all the individual router modules, each grouping related API endpoints and mapping them to their respective controller functions.
*   **`src/schemas/`**: Contains validation schemas (e.g., Joi schemas). These are used to validate incoming request data to ensure it adheres to predefined structures and constraints.
*   **`src/services/`**: Implements the core business logic of the application. Services interact with models, perform complex operations, and can integrate with external APIs or other services.
*   **`src/shared/`**: A collection of common utilities, enumerations (`enums.ts`), and shared interfaces used consistently across different parts of the application.
*   **`src/utils/`**: Provides various utility functions that encapsulate common, reusable logic, such as JWT handling, OTP generation, email/SMS sending, and other helper functions.