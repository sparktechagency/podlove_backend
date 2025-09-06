import { getMgmToken } from "@utils/getMgmToken";
import { ENUM_LIVE_STREAM_STATUS, HMS_ENDPOINT } from "./index";
import { createRoomCodesForAllRoles, generateRoomName } from "./podcast.helpers";
import { StreamRoom } from "./podcast.model";

const hms_access_key = process.env.HMS_ACCESS_KEY;
const hms_secret = process.env.HMS_SECRET_KEY;
const template_id = process.env.HMS_TEMPLATE_ID;

const createStreamingRoom = async (profileId: string) => {
    const liveRoom = await StreamRoom.findOne({
        host: profileId,
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
        host: profileId,
        name,
        template_id: template_id,
        room_id: roomData.id,
        status: ENUM_LIVE_STREAM_STATUS.live,
        roomCodes,
    });
    // const joinToken = await getJoinToken({
    //     user_id: profileId,
    //     role: 'host',
    //     room_id: roomData.id,
    // });

    return { roomData, roomCodes };
};



// const getJoinToken = (payload: {
//     user_id: string;
//     role: string;
//     room_id: string;
// }) => {
//     if (!config.hms.hms_secret || !config.hms.hms_access_key) {
//         throw new Error('HMS access key or secret is missing in config');
//     }

//     const tokenPayload = {
//         access_key: config.hms.hms_access_key,
//         room_id: payload.room_id,
//         user_id: payload.user_id,
//         role: payload.role, // e.g. "host" | "guest"
//         type: 'app',
//         version: 2,
//         jti: uuidv4(),
//     };

//     const token = jwt.sign(tokenPayload, config.hms.hms_secret as string, {
//         algorithm: 'HS256',
//         expiresIn: '24h',
//     });

//     return token;
// };


const LiveStreamingServices = {
    createStreamingRoom
};

export default LiveStreamingServices;