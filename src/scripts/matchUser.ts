import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/userModel";
import { searchSimilarUsers } from "../services/vectorService";

async function testMatch() {
    const userIdArg = process.argv[2];

    if (!userIdArg) {
        console.error("❌ Please provide a User ID: pnpm matching:<userid>");
        process.exit(1);
    }

    try {
        console.log(`🔎 Finding matches for user: ${userIdArg}...`);

        // 1. Connect to MongoDB
        if (!process.env.ATLAS_URI) {
            throw new Error("ATLAS_URI is not defined in .env");
        }
        await mongoose.connect(process.env.ATLAS_URI as string);
        console.log("✅ Connected to MongoDB");

        // 2. Fetch the user
        const user = await User.findById(userIdArg);
        if (!user) {
            console.error("❌ User not found in MongoDB");
            return;
        }

        if (!user.isProfileComplete) {
            console.warn("⚠️ Warning: User profile is not complete. Results may be limited.");
        }

        // 3. Search for similar users
        const results = await searchSimilarUsers({
            user,
            topK: 10,
            minSimilarityScore: 0.3, // Lower threshold for testing
        });

        console.log(`\n✨ Found ${results.length} matches:\n`);

        for (const res of results) {
            console.log(`-----------------------------------------`);
            console.log(`User ID: ${res.userId}`);
            console.log(`Name: ${res.metadata.name}`);
            console.log(`Score: ${(res.similarityScore * 100).toFixed(2)}%`);
            console.log(`Metadata:`, JSON.stringify(res.metadata, null, 2));
        }
        console.log(`-----------------------------------------`);

    } catch (error: any) {
        console.error("❌ Matching test failed:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

testMatch();
