
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import LiveStreamingServices from "./podcast.service";

const createStreamingRoom = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const podcastId = req.params.podcastId;
    const primaryUser = req.user.userId;
    const privacy = await LiveStreamingServices.createStreamingRoom(primaryUser, podcastId);
    return res.status(StatusCodes.OK).json({ success: true, message: "Privacy policy updated successfully", data: privacy });
};

const postNewRecordInWebhook = async (req: Request, res: Response, next: NextFunction): Promise<any> => {

    const privacy = await LiveStreamingServices.postNewRecordInWebhook(req as any);
    return res.status(StatusCodes.OK).json({ success: true, message: "Privacy policy updated successfully", data: privacy });
};

const getDownloadLink = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const getDow = req.query.fileUrl;
    if (!getDow) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Record id is required", data: {} });
    }
    const privacy = await LiveStreamingServices.getDownloadLink(getDow as any);
    return res.status(StatusCodes.OK).json({ success: true, message: "Download successfully", data: privacy });
};


const LivePodcastController = {
    createStreamingRoom,
    postNewRecordInWebhook,
    getDownloadLink
};

export default LivePodcastController;
