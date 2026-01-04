import "dotenv/config";
import User from "../src/models/userModel";
import { connectDB } from "../src/connection/atlasDB";
import vectorService from "../src/services/vectorService";

/**
 * Script to migrate ALL MongoDB user data to Pinecone.
 * Each user will be represented by 3 vectors: profile, preferences, and compatibility.
 */

async function migrate() {
    try {
        console.log("🚀 Starting Full Pinecone Migration...");

        // 1. Connect to MongoDB
        await connectDB();

        // 2. Fetch all users
        console.log("📥 Fetching all users from MongoDB...");
        const users = await User.find({}).lean();
        console.log(`✅ Found ${users.length} users in MongoDB`);

        if (users.length === 0) {
            console.log("⚠️ No users found to migrate.");
            process.exit(0);
        }

        // 3. Optional: Create/Verify Index
        await vectorService.createIndex();

        // 4. CLEAN INDEX (Requested by user)
        console.log("🧹 Cleaning existing vectors from Pinecone...");
        await vectorService.deleteAllVectors();

        // 5. Batch upsert users to Pinecone
        console.log("📤 Migrating users to Pinecone (3 vectors per user, batch size: 5)...");

        // Process in small chunks to maintain limits
        const CHUNK_SIZE = 5;
        for (let i = 0; i < users.length; i += CHUNK_SIZE) {
            const chunk = users.slice(i, i + CHUNK_SIZE);
            console.log(`⏳ Migrating batch ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(users.length / CHUNK_SIZE)} (${chunk.length} users)...`);
            await vectorService.batchUpsertUserVectors(chunk as any);

            // Wait slightly between batches to respect OpenAI/Pinecone limits
            if (i + CHUNK_SIZE < users.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log("\n✅ Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    }
}

migrate();
