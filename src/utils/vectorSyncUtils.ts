/**
 * User Profile Update Hooks
 * 
 * Automatically sync user profile updates to Pinecone
 * This ensures the vector database stays up-to-date with user changes
 */

import { UserSchema } from "@models/userModel";
import { upsertUserVector, deleteUserVector } from "@services/vectorService";

/**
 * Hook to call after user profile update
 * Usage: Add to userController after successful profile updates
 */
export async function syncUserVectorOnUpdate(user: UserSchema): Promise<void> {
  try {
    // Only sync if profile is complete
    if (user.isProfileComplete) {
      await upsertUserVector(user);
      console.log(`✅ Synced user ${user._id} to Pinecone`);
    }
  } catch (error) {
    console.error(`⚠️  Failed to sync user ${user._id} to Pinecone:`, error);
    // Don't throw - vector sync failure shouldn't break user updates
  }
}

/**
 * Hook to call before user deletion
 */
export async function syncUserVectorOnDelete(userId: string): Promise<void> {
  try {
    await deleteUserVector(userId);
    console.log(`✅ Deleted user ${userId} from Pinecone`);
  } catch (error) {
    console.error(`⚠️  Failed to delete user ${userId} from Pinecone:`, error);
  }
}

/**
 * Batch sync multiple users (useful for cron jobs)
 */
export async function batchSyncUsers(users: UserSchema[]): Promise<void> {
  const results = await Promise.allSettled(
    users.map((user) => syncUserVectorOnUpdate(user))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`✅ Batch sync completed: ${succeeded} succeeded, ${failed} failed`);
}

export default {
  syncUserVectorOnUpdate,
  syncUserVectorOnDelete,
  batchSyncUsers,
};
