import { getMgmToken } from "@utils/getMgmToken";
import { ENUM_LIVE_STREAM_STATUS, HMS_ENDPOINT } from "./index";
import { createRoomCodesForAllRoles, generateRoomName } from "./podcast.helpers";
import { MediaPolicy, PodcastFeedback, PodcastVideos, SMSPolicy, StreamRoom, SurveyFeedback } from "./podcast.model";
import Podcast from "@models/podcastModel";
import { PodcastStatus } from "@shared/enums";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Auth from "@models/authModel";
import User from "@models/userModel";
type ScheduleRound = "1st" | "2nd";
type QuestionStatus = "1stDone" | "2ndDone";

const template_id = process.env.HMS_TEMPLATE_ID;

const s3 = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
});

const createStreamingRoom = async (primaryUser: string, podcastId: string) => {
    console.log(`✅ Podcast== ${podcastId} status set to PLAYING`);
    const podcast = await Podcast.findById(podcastId)
    if (!podcast) {
        throw new Error("Podcast not found");
    }

    if (podcast.status !== PodcastStatus.STREAM_START) {
        // throw new Error("Your schedule time has not started yet");
    }

    // const liveRoom = await StreamRoom.findOne({
    //     broadcaster: primaryUser,
    //     $or: [
    //         { status: ENUM_LIVE_STREAM_STATUS.live },
    //         { status: ENUM_LIVE_STREAM_STATUS.wating },
    //     ],
    // });

    // // console.log('liveRoom', liveRoom)

    // if (liveRoom) {
    //     throw new Error("You can't able to start another live , because you already created a room for live , please join with that");
    // }

    const name = generateRoomName();
    const response = await fetch(`${HMS_ENDPOINT}/rooms`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getMgmToken()}`,
        },
        body: JSON.stringify({
            name,
            template_id: template_id,
        }),
    });
    const roomData = await response.json();


    const roomCodes = await createRoomCodesForAllRoles(roomData.id);

    await StreamRoom.create({
        broadcaster: primaryUser,
        podcastId,
        name,
        template_id: template_id,
        room_id: roomData.id,
        status: ENUM_LIVE_STREAM_STATUS.live,
        roomCodes,
    });

    const podcastUpdate = await Podcast.findByIdAndUpdate(
        podcastId,
        {
            roomCodes,
            room_id: roomData.id,
            status: PodcastStatus.PLAYING,
        },
        { new: true }
    );

    if (!podcastUpdate) {
        throw new Error("Failed to update podcast with room codes");
    }

    return { roomData, podcast: podcastUpdate };
};

const getDownloadLink = async (fileKey: string): Promise<string> => {
    try {
        const bucket = process.env.AWS_S3_BUCKET;
        if (!bucket) throw new Error("AWS_S3_BUCKET is not set");

        console.log("Generating signed URL for fileKey:", fileKey);

        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: fileKey,
            ResponseContentDisposition: `attachment; filename="${fileKey.split("/").pop()}"`,
        });
        // @ts-ignore
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        return url;
    } catch (error) {
        console.error("Error generating S3 signed URL:", error);
        throw new Error(`Failed to generate download link: ${(error as Error).message}`);
    }
};

const postNewRecordInWebhook = async (req: Request) => {
    try {
        const event = req.body as any;
        const roomId = event.room_id;
        console.log("roomId", roomId)

        const room = await Podcast.findOne({ room_id: roomId })

        if (!room) {
            throw new Error("Room Id Not Found;");
        }

        const data = event.data;
        // stream.recording.success
        if (event.type.includes("recording.success")) {
            // console.log("recording.success")
            const fileUrl: string = data?.hls_vod_recording_presigned_url || data?.recording_presigned_url;
            const extension = fileUrl.endsWith(".mp4") ? "mp4" : "mp4";
            const fileName = `${data.room_id}_${data.session_id}_${Date.now()}.${extension}`;
            // console.log("data", data)

            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
            const fileBuffer = Buffer.from(await response.arrayBuffer());

            const uploadParams = {
                Bucket: process.env.AWS_S3_BUCKET as string,
                Key: `recordings/${fileName}`,
                Body: fileBuffer,
                ContentType: "application/vnd.apple.mpegurl",
            };

            await s3.send(new PutObjectCommand(uploadParams));

            // 🔹 Generate public S3 URL
            const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;

            await Podcast.updateOne(
                { room_id: roomId },
                {
                    // $set: { status: PodcastStatus.DONE },
                    $push: {
                        recordingUrl: {
                            video: s3Url,
                            sessionId: data.session_id,
                        },
                    },
                }
            );

        }

        if (event.type.includes("end.success") || event.type.includes("close.success")) {
            // console.log("leave.success || end.success || close.success")
            const room = await Podcast.findOne({ room_id: roomId })
            if (!room) {
                throw new Error("Room Id Not Found;");
            }

            console.log("room.scheduleStatus", room.scheduleStatus)

            if (room.scheduleStatus === '1st') {
                await Podcast.updateOne(
                    { room_id: roomId },
                    {
                        $set: {
                            status: PodcastStatus.FINISHED,
                            finishStatus: "1stFinish"
                        }
                    }
                );

            }

            if (room.scheduleStatus === '2nd') {
                await Podcast.updateOne(
                    { room_id: roomId },
                    {
                        $set: {
                            status: PodcastStatus.FINISHED,
                            finishStatus: "2ndFinish",
                            isComplete: true,
                        }
                    }
                );

            }

            return;

        }

        if (event.type.includes("open.success") || event.type.includes("join.success")) {
            await Podcast.updateOne(
                { room_id: roomId },
                { $set: { status: PodcastStatus.PLAYING, finishStatus: null } }
            );
            return;
        }

        return;
    } catch (err: any) {
        console.error("❌ Error in webhook handler:", err);
    }
};

const sendQuestionsAnswer = async (req: any) => {
    try {
        const userId = req.user.userId;

        const { podcastId, responses, scheduleStatus } = req.body as {
            podcastId: string;
            scheduleStatus: "1st" | "2nd";
            responses: { question: string; answer: any }[];
        };

        console.log("req.body", scheduleStatus)

        if (!podcastId || !responses || !responses.length) {
            throw new Error("Podcast ID and responses are required");
        }

        const feedback = new PodcastFeedback({
            userId,
            podcastId,
            responses
        });

        await feedback.save();

        const statusMap: Record<ScheduleRound, QuestionStatus> = {
            "1st": "1stDone",
            "2nd": "2ndDone"
        };

        const questionsStatus = statusMap[scheduleStatus];
        console.log("questionsStatus", questionsStatus)

        const podcast = await Podcast.findByIdAndUpdate(podcastId, {
            questionsStatus: questionsStatus
        });

        const podcastQ = await Podcast.findOneAndUpdate(
            {
                _id: podcastId,
                "participants.user": userId
            },
            {
                $set: {
                    "participants.$.isQuestionAnswer": questionsStatus
                }
            },
            { new: true }
        );

        if (questionsStatus === "2ndDone") {
            const user = await User.findByIdAndUpdate(userId, {
                isPodcastActive: false
            });

        }

        if (!podcast || !podcastQ) {
            throw new Error("Podcast not found");
        }

        return feedback
    } catch (error) {
        console.error("Error saving podcast feedback:", error);
        throw new Error("Failed to save feedback");
    }
};

const send7daysSurveyFeedback = async (user: any, payload: any) => {
    try {
        const feedback = new SurveyFeedback({
            userId: user.userId,
            responses: payload.responses
        });

        await feedback.save();

        const authUser = await Auth.findByIdAndUpdate(user.authId, {
            shareFeedback: "completed"
        });
        if (!authUser) {
            throw new Error("User not found");
        }

        return feedback
    } catch (error) {
        console.error("Error saving podcast feedback:", error);
        throw new Error("Failed to save feedback");
    }
}

const getUser7daysSurveyFeedback = async (userId: any) => {
    try {

        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        const feedback = await SurveyFeedback.findOne({ userId });
        // if (!feedback) {
        //     throw new Error("This user has not submitted any feedback yet");
        // }

        return feedback
    } catch (error) {
        console.error("Error saving podcast feedback:", error);
        throw new Error("Failed to save feedback");
    }
}

const uploadVideos = async (req: any) => {
    try {
        if (!req.file) {
            throw new Error("No video file uploaded");
        }

        const fileKey = `videos/${Date.now()}.mp4`;

        // if (req.file.mimetype !== "video/mp4") {
        //     throw new Error("Only MP4 format is allowed");
        // }

        // S3 upload params
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: fileKey,
            Body: req.file.buffer,
            ContentType: "video/mp4",
        };

        // Upload to S3
        await s3.send(new PutObjectCommand(params));

        const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

        await PodcastVideos.create({ video: fileUrl });

        return {
            message: "Video uploaded successfully",
            url: fileUrl,
        };
    } catch (error) {
        console.error(error);
    }
}

// ======================
const checkFileExists = async (fileKey: string) => {
    try {
        await s3.send(new HeadObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: fileKey,
        }));
        return true;
    } catch (err: any) {
        if (err.name === "NotFound") return false;
        throw err;
    }
};

const getPresignedUrl = async (fileKey: string) => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: fileKey,
    });

    // @ts-ignore
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return url;
};

const getExistingVideos = async () => {
    try {
        const allVideos = await PodcastVideos.find().sort({ createdAt: -1 }) as any[];

        const videoPromises = allVideos.map(async (doc) => {
            const urlObj = new URL(doc.video);
            const key = urlObj.pathname.slice(1);

            const exists = await checkFileExists(key);
            if (exists) {
                const presignedUrl = await getPresignedUrl(key);
                return { ...doc.toObject(), presignedUrl };
            }
            return null;
        });

        const existingVideos = (await Promise.all(videoPromises)).filter(Boolean);
        return existingVideos;
    } catch (error) {
        console.error("❌ Error fetching existing videos:", error);
        throw new Error("Failed to fetch videos");
    }
};

// ====================
const deleteFileFromS3 = async (fileKey: string) => {
    try {
        await s3.send(
            new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                Key: fileKey,
            })
        );
        return true;
    } catch (err) {
        console.error("❌ Error deleting file from S3:", err);
        return false;
    }
};

const deleteVideo = async (videoId: string) => {
    try {
        const videoDoc = await PodcastVideos.findById(videoId) as any;
        if (!videoDoc) {
            throw new Error("Video not found");
        }

        const urlObj = new URL(videoDoc.video);
        const key = urlObj.pathname.slice(1);

        const deletedFromS3 = await deleteFileFromS3(key);
        if (!deletedFromS3) {
            throw new Error("Failed to delete file from S3");
        }

        // Delete from MongoDB
        await PodcastVideos.findByIdAndDelete(videoId);

        return { success: true, message: "Video deleted successfully" };
    } catch (err: any) {
        console.error("❌ Error deleting video:", err);
        return { success: false, message: err.message };
    }
};

// ============================
const addUpdateSMSPolicy = async (payload: any) => {
    const checkIsExist = await SMSPolicy.findOne();
    if (checkIsExist) {
        return await SMSPolicy.findOneAndUpdate({}, payload, {
            new: true,

            runValidators: true,
        });
    } else {
        return await SMSPolicy.create(payload);
    }
};

const getSMSPolicy = async () => {
    return await SMSPolicy.findOne();
};

const addUpdateMediaPolicy = async (payload: any) => {
    const checkIsExist = await MediaPolicy.findOne();
    if (checkIsExist) {
        return await MediaPolicy.findOneAndUpdate({}, payload, {
            new: true,

            runValidators: true,
        });
    } else {
        return await MediaPolicy.create(payload);
    }
};

const getMediaPolicy = async () => {
    return await MediaPolicy.findOne();
};

const LiveStreamingServices = {
    getMediaPolicy,
    addUpdateMediaPolicy,
    addUpdateSMSPolicy,
    getSMSPolicy,
    getExistingVideos,
    uploadVideos,
    createStreamingRoom,
    postNewRecordInWebhook,
    getDownloadLink,
    sendQuestionsAnswer,
    send7daysSurveyFeedback,
    getUser7daysSurveyFeedback,
    deleteVideo
};

export default LiveStreamingServices;