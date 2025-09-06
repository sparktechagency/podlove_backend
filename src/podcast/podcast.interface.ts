import { Types } from "mongoose";
import { ENUM_LIVE_STREAM_STATUS } from "./index";

export interface IStreamRoom {
    host: Types.ObjectId;
    name: string;
    description: string;
    template_id: string;
    room_id: string;
    status: (typeof ENUM_LIVE_STREAM_STATUS)[keyof typeof ENUM_LIVE_STREAM_STATUS];
    startTime?: Date;
    endTime?: Date;
    roomCodes: IRoomCode[];
    recordings: IRecording[];
}
export interface IRecording {
    session_id: string;
    started_at?: Date;
    ended_at?: Date;
    duration?: number;
    url: string;
}

export interface IRoomCode {
    id: string;
    code: string;
    room_id: string;
    role: string;
    enabled: boolean;
    created_at: string;
    updated_at: string;
}