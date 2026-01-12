import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/userModel";
import { batchUpsertUserVectors } from "../services/vectorService";

/**
 * Script to fix incorrect ages in Pinecone
 * This updates all users with complete profiles to recalculate their ages correctly
 */
async function fixAges() {
  try {
    console.log("🔧 Starting Pinecone age fix...");

    // 1. Connect to MongoDB
    if (!process.env.ATLAS_URI) {
      throw new Error("ATLAS_URI is not defined in .env");
    }
    await mongoose.connect(process.env.ATLAS_URI);
    console.log("✅ Connected to MongoDB");

    // 2. Fetch users with dateOfBirth and complete profiles
    const users = await User.find({
      isProfileComplete: true,
      dateOfBirth: { $exists: true, $ne: "" },
    });
    console.log(`📊 Found ${users.length} users with dateOfBirth`);

    if (users.length === 0) {
      console.log("ℹ️ No users to update.");
      return;
    }

    // 3. Display sample of users to verify
    console.log("\n📋 Sample users:");
    users.slice(0, 3).forEach((user) => {
      console.log(
        `  - ${user.name || "Unknown"} (${user._id}): DOB=${user.dateOfBirth}`
      );
    });

    // 4. Update vectors in Pinecone (ages will be recalculated)
    console.log("\n⏳ Updating Pinecone vectors with corrected ages...");
    await batchUpsertUserVectors(users);

    console.log("✨ Age fix completed successfully!");
    console.log(
      `✅ Updated ${users.length} user${users.length !== 1 ? "s" : ""} in Pinecone`
    );
  } catch (error: any) {
    console.error("❌ Age fix failed:", error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

fixAges();
