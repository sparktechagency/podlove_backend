import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/userModel";
import { getIndex } from "../services/vectorService";
import { generateEmbedding } from "../services/embeddingService";
import { connectDB } from "../connection/atlasDB";

async function match(userId: string) {
    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error("❌ Invalid User ID");
            process.exit(1);
        }

        await connectDB();
        console.log(`🔍 Finding matches for user: ${userId}`);

        const user = await User.findById(userId);
        if (!user) {
            console.error("❌ User not found in MongoDB");
            process.exit(1);
        }

        const index = await getIndex();
        const { searchSimilarUsers } = require("../services/vectorService");

        // Perform bidirectional search
        const results = await searchSimilarUsers({
            user,
            topK: 10,
            minSimilarityScore: 0.1, // Show more for testing
        });

        console.log("\n--- 🎯 AGGREGATED RESULTS ---");
        console.log(`Found ${results.length} total matches.\n`);

        results.forEach((m: any, i: number) => {
            console.log(`${i + 1}. User: ${m.metadata?.name}`);
            console.log(`   ID: ${m.userId}`);
            console.log(`   Type: profile`);
            console.log(`   Avg Score: ${m.similarityScore.toFixed(4)}`);
            console.log(`   -------------------`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Matching failed:", error);
        process.exit(1);
    }
}

const userIdArg = process.argv[2];
if (!userIdArg) {
    console.error("❌ Please provide a user ID: pnpm matching:<userid>");
    process.exit(1);
}

match(userIdArg);
