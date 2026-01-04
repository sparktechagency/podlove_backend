import "dotenv/config";
import User from "../src/models/userModel";
import { connectDB } from "../src/connection/atlasDB";
import vectorService from "../src/services/vectorService";

/**
 * Script to test the bidirectional vector matching logic for a specific user.
 * 
 * Usage: 
 * npx ts-node -r tsconfig-paths/register scripts/testMatching.ts <userId>
 */

async function test() {
    const userId = process.argv[2];
    if (!userId) {
        console.error("❌ Please provide a User ID: npx ts-node -r tsconfig-paths/register scripts/testMatching.ts <USER_ID>");
        process.exit(1);
    }

    try {
        console.log(`🔍 Initializing matching test for user: ${userId}...`);
        await connectDB();

        const user = await User.findById(userId).lean();
        if (!user) {
            console.error(`❌ User not found in MongoDB: ${userId}`);
            process.exit(1);
        }

        console.log(`👤 User: ${user.name} (${user.gender}, Age: ${calculateAge(user.dateOfBirth)})`);
        console.log(`📍 Location: ${user.location?.place || 'Unknown'}`);
        console.log(`🎯 Preferences: Seeking ${user.preferences?.gender?.join('/')}, Age ${user.preferences?.age?.min}-${user.preferences?.age?.max}`);
        console.log(`--------------------------------------------------`);

        const matches = await vectorService.searchSimilarUsers({
            user: user as any,
            topK: 10,
            minSimilarityScore: 0.1 // Low threshold for testing to see values
        });

        console.log(`\n✨ Found ${matches.length} matches:`);

        matches.forEach((match, index) => {
            console.log(`\n${index + 1}. ${match.metadata.name} (ID: ${match.userId})`);
            console.log(`   📊 Total Score: ${match.similarityScore.toFixed(4)}`);
            console.log(`   📉 Breakdown:`);
            console.log(`      - Profile Match (My Prefs -> Their Profile): ${match.breakdown.profileScore.toFixed(4)}`);
            console.log(`      - Reciprocal Match (Their Prefs -> My Profile): ${match.breakdown.reciprocalScore.toFixed(4)}`);
            console.log(`      - Compatibility Match: ${match.breakdown.compScore.toFixed(4)}`);
            console.log(`   🛡️ Metadata: ${match.metadata.gender}, Age ${match.metadata.age}, ${match.metadata.bodyType}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
}

function calculateAge(dateOfBirth: any): number {
    if (!dateOfBirth) return 0;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

test();
