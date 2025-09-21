
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

const extractKeyFromUrl = (url: string) => {
    try {
        const parsed = new URL(url);
        return parsed.pathname.substring(1);
    } catch {
        throw new Error("Invalid S3 URL");
    }
};

const getDownloadLink = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { fileUrl } = req.body;

    if (!fileUrl) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "fileUrl is required",
            data: {},
        });
    }
    const fileKey = extractKeyFromUrl(fileUrl);
    const signedUrl = await LiveStreamingServices.getDownloadLink(fileKey);

    return res.status(StatusCodes.OK).json({
        success: true,
        message: "Download URL generated successfully",
        data: signedUrl,
    });
};


const sendQuestionsAnswer = async (req: Request, res: Response, next: NextFunction): Promise<any> => {

    const result = await LiveStreamingServices.sendQuestionsAnswer(req as any);
    return res.status(StatusCodes.OK).json({ success: true, message: "Feedback submitted successfully", data: result });
};

const LivePodcastController = {
    sendQuestionsAnswer,
    createStreamingRoom,
    postNewRecordInWebhook,
    getDownloadLink
};

export default LivePodcastController;
