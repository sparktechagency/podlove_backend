import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/userModel";
import { batchUpsertUserVectors, clearIndex } from "../services/vectorService";
import { connectDB } from "../connection/atlasDB";

async function migrate() {
    try {
        console.log("🚀 Starting Pinecone migration...");

        // 1. Connect to MongoDB
        await connectDB();
        console.log("✅ Connected to MongoDB");

        // 2. Clear Pinecone index
        await clearIndex();

        // 3. Fetch all users from MongoDB with complete profiles
        const users = await User.find({ isProfileComplete: true });
        console.log(`📊 Found ${users.length} users with complete profiles to migrate.`);

        if (users.length === 0) {
            console.log("ℹ️ No users to migrate. Exiting.");
            process.exit(0);
        }

        // 4. Batch upsert to Pinecone
        await batchUpsertUserVectors(users as any);

        console.log("🏁 Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrate();
