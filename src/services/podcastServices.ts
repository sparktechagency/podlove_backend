import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel"; // Adjust the import path as necessary
import { PodcastStatus, SubscriptionPlanName } from "@shared/enums";
import { StatusCodes } from "http-status-codes";
import createError from "http-errors";
import Notification from "@models/notificationModel";
import cron from "node-cron";
import mongoose, { Types } from "mongoose";
// import { time } from "console";
import { DateTime } from "luxon";
import { scheduler } from "node:timers/promises";
import User from "@models/userModel";
interface Participants {
  user: Types.ObjectId;
  isAllow: Boolean;
  score: number;
}
[];

interface SelectedUserBody {
  user: Types.ObjectId;
}
[];
interface MarkedParticipant extends Participants {
  isAllow: boolean;
}

// const podcastActions = async(req: Request, res: Response, next: NextFunction) : Promise<any> => {
//   const { podcastId, status, selectedUserId, schedule } = req.body;

//   if (!podcastId) {
//     return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "podcastId is required" });
//   }

//   const podcast = await Podcast.findById(podcastId);
//   if (!podcast) throw createError(StatusCodes.NOT_FOUND, "Podcast not found");

//   if (schedule) {
//     const { date, day, time } = schedule;
//     if (date) podcast.schedule.date = date;
//     if (day) podcast.schedule.day = day;
//     if (time) podcast.schedule.time = time;
//     podcast.status = PodcastStatus.SCHEDULED;
//   }

//   if (selectedUserId) {
//     podcast.selectedUser = selectedUserId;
//     podcast.status = PodcastStatus.DONE;
//   }

//   if (status) {
//     podcast.status = status;
//   }

//   const [saveError] = await to(podcast.save());
//   if (saveError) return next(saveError);

//   return res.status(StatusCodes.OK).json({
//     success: true,
//     message: "Podcast updated successfully",
//     data: podcast,
//   });
// };

const podcastDone = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const podcastId = req.body.podcastId;
  const podcast = await Podcast.findById(podcastId);
  if (!podcast) throw createError(StatusCodes.NOT_FOUND, "Podcast not found");

  podcast.status = PodcastStatus.DONE;
  console.log("podcast status: ", podcast);
  await podcast.save();
  const feedbackNotification = await Notification.create({
    type: "podcast_feedback",
    user: podcast.primaryUser,
    message: [
      {
        title: "Share your feedback!",
        description: "Please fill the survey for your podcast feedback.",
      },
    ],
    read: false,
    section: "user",
  });
  if (!feedbackNotification) {
    throw createError(StatusCodes.BAD_GATEWAY, "Notification failed to create");
  }
  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: { status: podcast.status } });
};

// const setSchedule = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
//   const hostUserId = req.user.userId;
//   if(!hostUserId){
//     throw createError(StatusCodes.BAD_GATEWAY, "Unauthorized user");
//   }
//   const { podcastId, date, day, time } = req.body;

//   const podcast  = await Podcast.findById(podcastId);
//   if (!podcast) throw createError(StatusCodes.NOT_FOUND, "Podcast not found!");

//   podcast.schedule.date = date;
//   podcast.schedule.day = day;
//   podcast.schedule.time = time;
//   podcast.status = PodcastStatus.SCHEDULED;

//   await podcast.save();

//        // a) Primary user notification
//     const primaryNotif = new Notification({
//       type: 'podcast_scheduled',
//       user: primaryUserId,
//       message: [{
//         title:       'Podcast scheduled!',
//         description: `The podcast will be held on ${date} at ${time}`,
//       }],
//       read:    false,
//       section: 'user',
//     });

//     // b) Participant notifications
//     const participantSaves = podcast.participants.map(part => {
//       const userId = part.user.toString();
//       const inviteNotif = new Notification({
//         type: 'podcast_invited',
//         user: userId,
//         message: [{
//           title:       'You’re invited!',
//           description: `You have podcast on ${date} at ${time}`,
//         }],
//         read:    false,
//         section: 'user',
//       });
//       return inviteNotif.save();
//     });

//     // c) Save primary and all participant notifications
//     const [primarySaved, ...others] = await Promise.all([
//       primaryNotif.save(),
//       ...participantSaves
//     ]);

//   return res.status(StatusCodes.OK).json({ success: true, message: "Schedule updated successfully", data: podcast });
// };

const setSchedule = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // Ensure the request is authenticated
    const hostUserId = req.admin.id;
    if (!hostUserId) {
      throw createError(StatusCodes.UNAUTHORIZED, "Unauthorized user");
    }

    const { podcastId, date, day, time } = req.body;
    const podcast = await Podcast.findById(podcastId);
    if (!podcast) {
      throw createError(StatusCodes.NOT_FOUND, "Podcast not found!");
    }

    // 1) Update schedule + status
    podcast.schedule = { date, day, time };
    podcast.status = PodcastStatus.SCHEDULED;
    await podcast.save();

    const primaryUserId = podcast.primaryUser.toString();

    // 2) Create notifications

    // (a) Primary user
    const primaryNotification = Notification.create({
      type: "podcast_scheduled",
      user: primaryUserId,
      message: [
        {
          title: "Podcast scheduled!",
          description: `The podcast will be held on ${date} at ${time}`,
        },
      ],
      read: false,
      section: "user",
    });

    // (b) All other participants
    const participantNotifications = podcast.participants.map((part) =>
      Notification.create({
        type: "podcast_invited",
        user: part.user.toString(),
        message: [
          {
            title: "You’re invited!",
            description: `You have podcast on ${date} at ${time}`,
          },
        ],
        read: false,
        section: "user",
      })
    );

    // 3) Wait for all to finish
    await Promise.all([primaryNotification, ...participantNotifications]);

    // 4) Respond
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Schedule updated and notifications created successfully",
      data: podcast,
    });
  } catch (err) {
    next(err);
  }
};

function markAllowedParticipants(participants: Participants[], selectedUserBody: SelectedUserBody[]): void {
  // Build a lookup set of selected user IDs (strings)
  const selectedSet = new Set<string>(selectedUserBody.map(({ user }: any) => user));

  // For each sub‐document, set the isAllow field
  participants.forEach((subdoc) => {
    // If there's no user, mark false
    if (!subdoc.user) {
      subdoc.isAllow = false;
      return;
    }

    // Normalize ObjectId or string to a single string
    const userStr = subdoc.user instanceof Types.ObjectId ? subdoc.user.toHexString() : subdoc.user;

    // Use Mongoose's built‑in setter so it tracks changes
    subdoc.isAllow = selectedSet.has(userStr);
  });
}

const selectUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const podcastId = req.body.podcastId;
  const selectedUserId = req.body.selectedUserId;
  console.log("podcast selected user Id: ", selectedUserId);
  const podcast = await Podcast.findById(podcastId);
  if (!podcast) throw createError(StatusCodes.NOT_FOUND, "Podcast not found!");

  podcast.selectedUser = selectedUserId;
  podcast.status = PodcastStatus.DONE;

  markAllowedParticipants(podcast.participants, selectedUserId);

  await podcast.save();
  console.log("podcast: ", podcast);
  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: podcast });
};

function parseScheduleDateInET(p: { schedule: { date: string; time: string } }): DateTime | null {
  const { date, time } = p.schedule;
  const dt = DateTime.fromFormat(`${date} ${time}`, "MM/dd/yyyy hh:mm a", { zone: "America/New_York" });
  return dt.isValid ? dt : null;
}

// async function notifyScheduledPodcasts(): Promise<void> {
//   const nowET = DateTime.now().setZone("America/New_York");
//   const oneHourMs = 1000 * 60 * 60;

//   // 1) Find all scheduled podcasts
//   const podcasts = await Podcast.find({
//     status: "Scheduled",
//     notificationSent: { $ne: true },
//   }).exec();
//   for (const p of podcasts) {
//     const scheduledET = parseScheduleDateInET(p);
//     if (scheduledET) {
//       const diffMs = scheduledET.toMillis() - nowET.toMillis();
//       if (diffMs > 0 && diffMs <= oneHourMs) {
//         try {
//           console.log("inside the notification created");
//           await Notification.create({
//             type: "podcast_upcoming",
//             user: p.primaryUser,
//             message: [
//               {
//                 title: "Your podcast is about to start!",
//                 description: `Your podcast is scheduled for ${p.schedule.date} at ${p.schedule.time}.`,
//               },
//             ],
//             read: false,
//             section: "user",
//           });

//           p.notificationSent = true;
//           await p.save();
//           console.log(`🔔 Notified user ${p.primaryUser} for podcast ${p._id}`);
//         } catch (err) {

//           console.error(`❌ Failed to notify for podcast ${p._id}:`, err);
//         }
//       }
//     }
//   }

//   const findScheduledTime = await Podcast.find({status: "Scheduled"});
//   for(let schedulePodcast of findScheduledTime){
//     let scheduler = parseScheduleDateInET(schedulePodcast);
//     if(scheduler === nowET){
//       try {
//      await Podcast.findOneAndUpdate(
//       { _id: schedulePodcast._id },
//       {
//         $set: {
//           status: PodcastStatus.PLAYING
//         },
//       }
//     )
//       .lean()
//       .exec();
//   } catch (err) {
//     console.error(`Failed to change to schedule for podcast:`, err);
//   }
//     }

//   }
// }

async function downgradeExpiredSubscriptions(): Promise<{
  n: number;
  nModified: number;
}> {
  // compute “one month ago”
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // filter: not already on the free listener plan, and startedAt ≥ 1 month ago
  const filter = {
    "subscription.plan": { $ne: SubscriptionPlanName.LISTENER },
    "subscription.startedAt": { $lte: oneMonthAgo },
  };

  // the reset you want
  const reset = {
    "subscription.id": "",
    "subscription.plan": SubscriptionPlanName.LISTENER,
    "subscription.fee": "Free",
    "subscription.status": "",
    "subscription.startedAt": now,
  };

  const result = await User.updateMany(filter, { $set: reset });
  return {
    n: result.matchedCount,
    nModified: result.modifiedCount,
  };
}

async function notifyScheduledPodcasts(): Promise<void> {
  const nowET = DateTime.now().setZone("America/New_York");
  const oneHourMs = 1000 * 60 * 60;

  // 1) Fetch everything once
  const podcasts = await Podcast.find({ status: "Scheduled" }).exec();

  // 2) Prepare batches
  const notifPromises: Promise<any>[] = [];
  const bulkOps: mongoose.AnyBulkWriteOperation[] = [];
   await downgradeExpiredSubscriptions();
  for (const p of podcasts) {
    const scheduledET = parseScheduleDateInET(p);
    if (!scheduledET) continue;

    const diffMs = scheduledET.toMillis() - nowET.toMillis();

    // a) Within next hour → notify if not already
    if (diffMs > 0 && diffMs <= oneHourMs && !p.notificationSent) {
      notifPromises.push(
        Notification.create({
          type: "podcast_upcoming",
          user: p.primaryUser,
          message: [
            {
              title: "Your podcast is about to start!",
              description: `Your podcast is scheduled for ${p.schedule.date} at ${p.schedule.time}.`,
            },
          ],
          read: false,
          section: "user",
        })
      );
      // mark notificationSent
      bulkOps.push({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { notificationSent: true } },
        },
      });
    }

    // b) Time’s up or passed → switch to PLAYING
    if (scheduledET <= nowET) {
      bulkOps.push({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { status: PodcastStatus.PLAYING } },
        },
      });
    }
  }

  // console.log("schedule: ", bulkOps);

  // 3) Fire off all notifications in parallel
  try {
    await Promise.all(notifPromises);
  } catch (err) {
    console.error("❌ Notification batch error:", err);
  }

  // 4) Apply status & notificationSent in one bulkWrite
  if (bulkOps.length) {
    try {
      await Podcast.bulkWrite(bulkOps);
      console.log(`✅ Applied ${bulkOps.length} updates`);
    } catch (err) {
      console.error("❌ bulkWrite failed:", err);
    }
  }
}

export function startPodcastScheduler(): void {
  // Run notifyScheduledPodcasts() every minute
  cron.schedule("*/20 * * * *", () => {
    console.log("Hello world");
    notifyScheduledPodcasts().catch((err) => console.error("Scheduler error:", err));
  });

  console.log("⏰ Podcast scheduler started (runs every 20 minute)");
}

const PodcastServices = {
  setSchedule,
  podcastDone,
  selectUser,
  startPodcastScheduler,
};

export default PodcastServices;
