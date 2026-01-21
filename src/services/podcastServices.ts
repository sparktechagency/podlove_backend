import { Request, Response, NextFunction } from "express";
import Podcast from "@models/podcastModel"; // Adjust the import path as necessary
import { PodcastStatus, SubscriptionPlanName } from "@shared/enums";
import { StatusCodes } from "http-status-codes";
import createError from "http-errors";
import Notification from "@models/notificationModel";
import cron from "node-cron";
import mongoose, { Types } from "mongoose";
import moment from "moment-timezone";
// import { time } from "console";
import { DateTime } from "luxon";
import { scheduler } from "node:timers/promises";
import User from "@models/userModel";
import LiveStreamingServices from "src/podcast/podcast.service";
interface Participants {
  user: Types.ObjectId;
  isAllow: Boolean;
  score: number;
}
[];
// ======================================

/**
 * Convert user's local time to server UTC time
 * @param dateStr - Date string in format "YYYY-MM-DD"
 * @param timeStr - Time string in format "HH:mm"
 * @param userTimeZone - User's timezone e.g. "America/Costa_Rica"
 * @returns string - Server UTC time in format "YYYY-MM-DD HH:mm"
 */
export const convertToServerTime = (
  dateStr: string,
  timeStr: string,
  userTimeZone: string
): string => {
  const userDateTimeStr = `${dateStr} ${timeStr}`; // e.g., "01/21/2026 04:45 PM"

  // Specify the format: MM/DD/YYYY hh:mm A
  const format = "MM/DD/YYYY hh:mm A";

  const serverUTC = moment.tz(userDateTimeStr, format, userTimeZone) // parse in user's TZ
    .utc() // convert to UTC
    .format("YYYY-MM-DD HH:mm"); // format for DB

  return serverUTC;
};
// =====================================
interface SelectedUserBody {
  user: Types.ObjectId;
}
[];
interface MarkedParticipant extends Participants {
  isAllow: boolean;
}

const podcastDone = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const podcastId = req.body.podcastId;
  const podcast = await Podcast.findById(podcastId);
  if (!podcast) throw createError(StatusCodes.NOT_FOUND, "Podcast not found");

  podcast.status = PodcastStatus.FINISHED;
  // console.log("podcast status: ", podcast);
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

const setSchedule = async (req: Request, res: Response, next: NextFunction): Promise<any> => {

  try {
    // Ensure the request is authenticated
    const hostUserId = req.admin.id;
    if (!hostUserId) {
      throw createError(StatusCodes.UNAUTHORIZED, "Unauthorized user");
    }

    const { podcastId, date, day, time, timezone } = req.body;
    const podcast = await Podcast.findById(podcastId);
    if (!podcast) {
      throw createError(StatusCodes.NOT_FOUND, "Podcast not found!");
    }

    console.log("timezone=================: ", date, time, timezone);
    // ✅ Convert user local time to server UTC
    const serverTime = convertToServerTime(date, time, timezone);

    // 1) Update schedule + status
    // podcast.schedule = { date, day, time };
    podcast.schedule = {
      date: serverTime.split(" ")[0],
      day,
      time: serverTime.split(" ")[1],
    };

    podcast.status = PodcastStatus.SCHEDULED;
    podcast.room_id = "";
    podcast.roomCodes = [];
    podcast.scheduleStatus = podcast.scheduleStatus;

    if (!podcast.scheduleStatus && !podcast.finishStatus) {
      podcast.scheduleStatus = "1st";
    } else if (
      podcast.scheduleStatus === "1st" &&
      podcast.finishStatus === "1stFinish"
    ) {
      podcast.scheduleStatus = "2nd";
    }

    await podcast.save();

    const primaryUserId = podcast.primaryUser.toString();

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
    const participantNotifications = podcast.participants.map((part: any) =>
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
  const selectedSet = new Set<string>(selectedUserBody.map(({ user }: any) => user));
  participants.forEach((subdoc) => {
    if (!subdoc.user) {
      subdoc.isAllow = false;
      return;
    }

    const userStr = subdoc.user instanceof Types.ObjectId ? subdoc.user.toHexString() : subdoc.user;
    subdoc.isAllow = selectedSet.has(userStr);
  });
}

// Not use this function anywhere for now
const selectUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { podcastId, selectedUserId } = req.body;

    // 1️⃣ Fetch podcast
    const podcast = await Podcast.findById(podcastId);
    if (!podcast) throw createError(StatusCodes.NOT_FOUND, "Podcast not found!");

    podcast.selectedUser = selectedUserId;
    markAllowedParticipants(podcast.participants, selectedUserId);
    await podcast.save();

    const getExpireTime = (fee?: string) => {
      if (fee === "Free") return new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      if (fee === "14.99") return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      if (fee === "29.99") return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year
      return "";
    };

    let userIds: Types.ObjectId[] = [];

    if (Array.isArray(selectedUserId)) {
      userIds = selectedUserId.map((u: any) => u.user || u);
    } else if (selectedUserId) {
      userIds = [selectedUserId];
    }

    if (podcast.primaryUser) userIds.push(podcast.primaryUser);

    // Remove duplicates
    userIds = [...new Set(userIds.map((id) => id.toString()))].map((id) => new Types.ObjectId(id));


    const usersToUpdate = await User.find({ _id: { $in: userIds } }) as any[];

    const bulkOps = usersToUpdate.map((user) => ({
      updateOne: {
        filter: { _id: user._id },
        update: { chatingtime: getExpireTime(user.subscription?.fee) },
      },
    }));

    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps);
    }

    return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: podcast });
  } catch (err) {
    next(err);
  }
};

function parseScheduleDateInET(p: { schedule: { date: string; time: string } }): DateTime | null {
  const { date, time } = p.schedule;
  const dt = DateTime.fromFormat(`${date} ${time}`, "MM/dd/yyyy hh:mm a", { zone: "America/New_York" });
  return dt.isValid ? dt : null;
}

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
    "subscription.plan": { $ne: SubscriptionPlanName.SAMPLER },
    "subscription.startedAt": { $lte: oneMonthAgo },
  };

  // the reset you want
  const reset = {
    "subscription.id": "",
    "subscription.plan": SubscriptionPlanName.SAMPLER,
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

  const podcasts = await Podcast.find({ status: "Scheduled" }).exec();

  const notifPromises: Promise<any>[] = [];
  const bulkOps: mongoose.AnyBulkWriteOperation[] = [];
  await downgradeExpiredSubscriptions();

  for (const p of podcasts) {
    const scheduledET = parseScheduleDateInET(p);
    if (!scheduledET) continue;

    const diffMs = scheduledET.toMillis() - nowET.toMillis();

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
      const primaryUserId = p?.primaryUser.toString();
      // @ts-ignore
      const postCastId = p?._id.toString();
      await LiveStreamingServices.createStreamingRoom(primaryUserId, postCastId)
      console.log(`✅ Podcast ${p._id} status set to PLAYING`);
    }
  }

  try {
    await Promise.all(notifPromises);
  } catch (err) {
    console.error("❌ Notification batch error:", err);
  }

  if (bulkOps.length) {
    try {
      await Podcast.bulkWrite(bulkOps);
      console.log(`✅ Applied ${bulkOps.length} updates`);
    } catch (err) {
      console.error("❌ bulkWrite failed:", err);
    }
  }
}

cron.schedule("* * * * *", () => {
  // console.log("=======Hello world=======");
  notifyScheduledPodcasts().catch((err) => console.error("Scheduler error:", err));
});

const updatePodcastStatusAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { podcastId, status } = req.body as { podcastId: string; status: "Finished" | "Playing" };

    if (!podcastId || !status) {
      throw createError(StatusCodes.BAD_REQUEST, "podcastId and status are required");
    }

    const podcast = await Podcast.findById(podcastId);
    if (!podcast) {
      throw createError(StatusCodes.NOT_FOUND, "Podcast not found!");
    }

    if (podcast.status === status) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: `Podcast is already in ${status} status`,
        data: podcast
      });
    }

    const finishStatus = podcast.scheduleStatus === '2nd' ? '2ndFinish' : '1stFinish';

    // Optional: update finishStatus depending on schedule
    if (status === 'Finished') {
      if (finishStatus === '2ndFinish') {
        await Podcast.findByIdAndUpdate(podcastId, {
          $set: {
            status: PodcastStatus.FINISHED,
            finishStatus: finishStatus,
          }
        }
        );
      } else {
        await Podcast.findByIdAndUpdate(podcastId,
          {
            $set: {
              status: PodcastStatus.FINISHED,
              finishStatus: finishStatus,
              isRequest: false,
              "participants.$[].isRequest": false,
            }
          }
        );
      }

    } else if (status === 'Playing') {
      if (finishStatus === '2ndFinish') {
        await Podcast.findByIdAndUpdate(podcastId,
          {
            $set: {
              status: 'Playing',
              finishStatus: '1stFinish',
            }
          }
        );
      } else {
        await Podcast.findByIdAndUpdate(podcastId,
          {
            $set: {
              status: 'Playing',
              finishStatus: null
            }
          }
        );
      }
    }

    const updatedPodcast = await Podcast.findById(podcastId);

    if (!updatedPodcast) {
      throw createError(StatusCodes.NOT_FOUND, "Podcast not found after update!");
    }

    console.log("updatedPodcast===============>: ", updatedPodcast.scheduleStatus, updatedPodcast.status, updatedPodcast.finishStatus);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Podcast status updated successfully",
      data: updatedPodcast
    });

  } catch (err) {
    next(err);
  }

};


const PodcastServices = {
  setSchedule,
  podcastDone,
  selectUser,
  updatePodcastStatusAdmin
};

export default PodcastServices;
