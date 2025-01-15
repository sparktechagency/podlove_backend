"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});
const upload = (file, location) => {
    return new Promise((resolve, reject) => {
        const resourceType = file.mimetype.startsWith("image/")
            ? "image"
            : file.mimetype.startsWith("audio/") || file.mimetype.startsWith("video/")
                ? "video"
                : "auto";
        const stream = cloudinary_1.v2.uploader.upload_stream({
            folder: location,
            resource_type: resourceType,
        }, (error, result) => {
            if (error) {
                console.error("Cloudinary Upload Error:", error);
                return reject(error);
            }
            if (result?.secure_url) {
                resolve(result.secure_url);
                console.log(result.secure_url);
            }
            else {
                reject(new Error("Failed to get secure URL from Cloudinary response."));
            }
        });
        try {
            stream.end(file.data);
        }
        catch (streamError) {
            console.error("Stream Error:", streamError);
            reject(streamError);
        }
    });
};
const remove = async (fileUrl) => {
    try {
        const urlParts = new URL(fileUrl);
        const path = urlParts.pathname;
        const publicId = path
            .split("/")
            .slice(2)
            .join("/")
            .replace(/\.[^/.]+$/, "");
        if (!publicId) {
            throw new Error("Unable to extract public ID from URL");
        }
        const result = await cloudinary_1.v2.uploader.destroy(publicId);
        return result;
    }
    catch (error) {
        console.error("Error deleting file:", error.message);
        throw error;
    }
};
const Cloudinary = {
    upload,
    remove,
};
exports.default = Cloudinary;
