import { getMgmToken } from "@utils/getMgmToken";
import { ENUM_LIVE_STREAM_STATUS, HMS_ENDPOINT } from "./index";
import { createRoomCodesForAllRoles, generateRoomName } from "./podcast.helpers";
import { StreamRoom } from "./podcast.model";
import Podcast from "@models/podcastModel";
import { PodcastStatus } from "@shared/enums";

// const hms_access_key = process.env.HMS_ACCESS_KEY;
// const hms_secret = process.env.HMS_SECRET_KEY;
const template_id = process.env.HMS_TEMPLATE_ID;

const createStreamingRoom = async (primaryUser: string, podcastId: string) => {

    const podcast = await Podcast.findById(podcastId)
    if (!podcast) {
        throw new Error("Podcast not found");
    }

    if (podcast.status !== PodcastStatus.PLAYING) {
        throw new Error("Your schedule time has not started yet");
    }

    const liveRoom = await StreamRoom.findOne({
        broadcaster: primaryUser,
        $or: [
            { status: ENUM_LIVE_STREAM_STATUS.live },
            { status: ENUM_LIVE_STREAM_STATUS.wating },
        ],
    });

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
            status: PodcastStatus.STREAM_START,
        },
        { new: true }
    );

    if (!podcastUpdate) {
        throw new Error("Failed to update podcast with room codes");
    }

    return { roomData, podcast: podcastUpdate };
};


const postNewRecordInWebhook = async (req: Request) => {
    const event = req.body;

    // return { roomData, podcast: podcastUpdate };
};

const postPodcastInWebhook = async (req: Request) => {
    const event = req.body;
    // return { roomData, podcast: podcastUpdate };
};

const LiveStreamingServices = {
    createStreamingRoom,
    postNewRecordInWebhook,
    postPodcastInWebhook
    // endStreamingRoom
};

export default LiveStreamingServices;