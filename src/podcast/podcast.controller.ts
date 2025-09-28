
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

const send7daysSurveyFeedback = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const result = await LiveStreamingServices.send7daysSurveyFeedback(req.user as any, req.body);
    return res.status(StatusCodes.OK).json({ success: true, message: "Feedback submitted successfully", data: result });
};

const getUser7daysSurveyFeedback = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const result = await LiveStreamingServices.getUser7daysSurveyFeedback(req.params.userId as any);
    return res.status(StatusCodes.OK).json({ success: true, message: "Feedback get successfully", data: result });
};


const uploadVideos = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const result = await LiveStreamingServices.uploadVideos(req);
    return res.status(StatusCodes.OK).json({ success: true, message: "Video uploaded successfully", data: result });
};

const getExistingVideos = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const result = await LiveStreamingServices.getExistingVideos();
    return res.status(StatusCodes.OK).json({ success: true, message: "Video get successfully", data: result });
};


const deleteVideo = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const result = await LiveStreamingServices.deleteVideo(req.params.videoId);
    return res.status(StatusCodes.OK).json({ success: true, message: "Video delete successfully", data: result });
};

// ===================================
const getMediaPolicy = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const result = await LiveStreamingServices.getMediaPolicy();
    return res.status(StatusCodes.OK).json({ success: true, message: "get successfully", data: result });
};

const addUpdateMediaPolicy = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const result = await LiveStreamingServices.addUpdateMediaPolicy(req.body);
    return res.status(StatusCodes.OK).json({ success: true, message: "Update successfully", data: result });
};

const getSMSPolicy = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const result = await LiveStreamingServices.getSMSPolicy();
    return res.status(StatusCodes.OK).json({ success: true, message: " get successfully", data: result });
};

const addUpdateSMSPolicy = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const result = await LiveStreamingServices.addUpdateSMSPolicy(req.body);
    return res.status(StatusCodes.OK).json({ success: true, message: "Update successfully", data: result });
};


const LivePodcastController = {
    addUpdateMediaPolicy,
    getMediaPolicy,

    getSMSPolicy,
    addUpdateSMSPolicy,

    deleteVideo,
    getExistingVideos,
    uploadVideos,
    sendQuestionsAnswer,
    createStreamingRoom,
    postNewRecordInWebhook,
    getDownloadLink,
    send7daysSurveyFeedback,
    getUser7daysSurveyFeedback
};

export default LivePodcastController;
