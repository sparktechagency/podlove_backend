import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel"; // Adjust the import path as necessary
import { PodcastStatus } from "@shared/enums";
import { StatusCodes } from "http-status-codes";
import to from "await-to-ts";
import createError from "http-errors";
import Notification from "@models/notificationModel";
import cron from "node-cron";
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
    const hostUserId = req.user.userId;
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

const selectUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const podcastId = req.body.podcastId;
  const selectedUserId = req.body.selectedUserId;

  const podcast = await Podcast.findById(podcastId);
  if (!podcast) throw createError(StatusCodes.NOT_FOUND, "Podcast not found!");

  podcast.selectedUser = selectedUserId;
  podcast.status = PodcastStatus.DONE;

  await podcast.save();

  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: podcast });
};

function parseScheduleDate(p: { schedule: { date: string; time: string } }): Date | null {
  const [dayStr, monthStr, yearStr] = p.schedule.date.split("/");
  if (!dayStr || !monthStr || !yearStr) return null;
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10) - 1; 
  const year = 2000 + parseInt(yearStr, 10);

  const timeNormalized = p.schedule.time.replace(".", ":").trim();
  const isoString = `${year}-${month + 1}`.padStart(2, "0") + `-${day.toString().padStart(2, "0")} ${timeNormalized}`;
  const dt = new Date(isoString);

  return isNaN(dt.getTime()) ? null : dt;
}

async function notifyScheduledPodcasts(): Promise<void> {
  const now = new Date();
  const oneHour = 1000 * 60 * 60;
  const inOneHour = new Date(now.getTime() + oneHour);
   console.log("one hour: ", oneHour);
  // 1) Find all podcasts with status "scheduled" that have NOT been notified:
  const podcasts = await Podcast.find({
    status: "Scheduled"
    // notificationSent: { $ne: true },
  }).exec();
  console.log("podcast: ", podcasts)
  for (const p of podcasts) {
    console.log("p: ", p);
    const scheduledDt = parseScheduleDate(p);
    if (!scheduledDt) {
      console.warn(`⚠️  Could not parse schedule for podcast ${p._id}`);
      continue;
    }
   console.log("scheduledDt: ", scheduledDt);
    // 2) If the scheduled time is within the next hour → notify
    if (scheduledDt >= now && scheduledDt <= inOneHour) {
      try {
        await Notification.create({
          type: "podcast_upcoming",
          user: p.primaryUser,
          message: [
            {
              title: "Your podcast is about to start!",
              description: `Your podcast is scheduled on ${p.schedule.day}, ${p.schedule.date} at ${p.schedule.time}.`,
            },
          ],
          read: false,
          section: "user",
        });

        // 3) Mark notificationSent to avoid duplication
        p.notificationSent = true;
        await p.save();

        console.log(`🔔 Notified user ${p.primaryUser} for podcast ${p._id}`);
      } catch (err) {
        console.error(`❌ Failed to notify for podcast ${p._id}:`, err);
      }
    }
  }
}

export function startPodcastScheduler(): void {
  // Run notifyScheduledPodcasts() every minute
  cron.schedule("* * * * *", () => {
    console.log("Hello world");
    notifyScheduledPodcasts().catch((err) => console.error("Scheduler error:", err));
  });

  console.log("⏰ Podcast scheduler started (runs every minute)");
}

const PodcastServices = {
  setSchedule,
  podcastDone,
  selectUser,
  startPodcastScheduler,
};

export default PodcastServices;
