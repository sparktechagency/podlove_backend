
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import LiveStreamingServices from "./podcast.service";

const createStreamingRoom = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const podcastId = req.params.podcastId;
    const primaryUser = req.user.userId;
    const privacy = await LiveStreamingServices.createStreamingRoom(primaryUser, podcastId);
    return res.status(StatusCodes.OK).json({ success: true, message: "Privacy policy updated successfully", data: privacy });
};

const LivePodcastController = {
    createStreamingRoom,
};

export default LivePodcastController;
