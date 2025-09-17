import { getMgmToken } from "@utils/getMgmToken";
import { ENUM_LIVE_STREAM_STATUS, HMS_ENDPOINT } from "./index";
import { createRoomCodesForAllRoles, generateRoomName } from "./podcast.helpers";
import { StreamRoom } from "./podcast.model";
import Podcast from "@models/podcastModel";
import { PodcastStatus } from "@shared/enums";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

    const liveRoom = await StreamRoom.findOne({
        broadcaster: primaryUser,
        $or: [
            { status: ENUM_LIVE_STREAM_STATUS.live },
            { status: ENUM_LIVE_STREAM_STATUS.wating },
        ],
    });

    // console.log('liveRoom', liveRoom)

    if (liveRoom) {
        throw new Error("You can't able to start another live , because you already created a room for live , please join with that");
    }

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
            // recording: { enabled: false },
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
        console.log("roomId", event)

        // if (event.type.includes("recording.success")) {
        //     throw new Error("Not a recording event");
        // }
        const roomId = event.room_id;
        console.log("roomId", roomId)

        const room = await Podcast.findOne({ room_id: roomId })

        if (!room) {
            throw new Error("Room Id Not Found;");
        }

        const data = event.data;
        // stream.recording.success
        if (event.type.includes("recording.success")) {
            console.log("recording.success")
            const fileUrl: string = data?.hls_vod_recording_presigned_url || data?.recording_presigned_url;
            const extension = fileUrl.endsWith(".mp4") ? "mp4" : "m3u8";
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
                    $set: { status: PodcastStatus.DONE },
                    $push: {
                        recordingUrl: {
                            video: s3Url,
                            sessionId: data.session_id,
                        },
                    },
                }
            );

        }

        if (event.type.includes("leave.success")) {
            console.log("leave.success")
            await Podcast.updateOne(
                { room_id: roomId },
                { $set: { status: PodcastStatus.DONE } }
            );
            return;
        }

        if (event.type.includes("end.success") || event.type.includes("close.success")) {
            console.log("leave.success || end.success || close.success")
            await Podcast.updateOne(
                { room_id: roomId },
                { $set: { status: PodcastStatus.FINISHED } }
            );
            return;
        }

        // if (event.type.includes("open.success") || event.type.includes("join.success")) {
        //     console.log("join.success")
        //     await Podcast.updateOne(
        //         { room_id: roomId },
        //         { $set: { status: PodcastStatus.PLAYING } }
        //     );
        //     return;
        // }

        return;
    } catch (err: any) {
        console.error("❌ Error in webhook handler:", err);
    }
};

const LiveStreamingServices = {
    createStreamingRoom,
    postNewRecordInWebhook,
    getDownloadLink
    // endStreamingRoom
};

export default LiveStreamingServices;