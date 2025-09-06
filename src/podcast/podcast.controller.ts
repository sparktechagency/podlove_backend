import Privacy from "@models/privacyModel";
import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import LiveStreamingServices from "./podcast.service";

const createStreamingRoom = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const profileId = req.params.profileId;
    const privacy = await LiveStreamingServices.createStreamingRoom(profileId);
    return res.status(StatusCodes.OK).json({ success: true, message: "Privacy policy updated successfully", data: privacy });
};

const LivePodcastController = {
    createStreamingRoom,
};

export default LivePodcastController;
