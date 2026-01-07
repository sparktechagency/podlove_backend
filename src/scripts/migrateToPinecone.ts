import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/userModel";
import { batchUpsertUserVectors, clearIndex } from "../services/vectorService";

async function migrate() {
    try {
        console.log("🚀 Starting Pinecone migration...");

        // 1. Connect to MongoDB
        if (!process.env.ATLAS_URI) {
            throw new Error("ATLAS_URI is not defined in .env");
        }
        await mongoose.connect(process.env.ATLAS_URI);
        console.log("✅ Connected to MongoDB");

        // 2. Clear Pinecone Index
        await clearIndex();
        console.log("✅ Pinecone index cleared");

        // 3. Fetch all users with complete profiles
        const users = await User.find({ isProfileComplete: true });
        console.log(`📊 Found ${users.length} users with complete profiles`);

        if (users.length === 0) {
            console.log("ℹ️ No users to migrate.");
            return;
        }

        // 4. Migrate in batches
        console.log("⏳ Migrating vectors... This might take a while.");
        await batchUpsertUserVectors(users);

        console.log("✨ Migration completed successfully!");
    } catch (error: any) {
        console.error("❌ Migration failed:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrate();
