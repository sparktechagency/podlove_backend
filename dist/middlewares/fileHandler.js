"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileHandler = void 0;
const cloudinary_1 = __importDefault(require("../shared/cloudinary"));
const http_errors_1 = __importDefault(require("http-errors"));
const http_status_codes_1 = require("http-status-codes");
const uploadFileToCloudinary = async (file, folder) => {
    try {
        return await cloudinary_1.default.upload(file, folder);
    }
    catch (error) {
        throw new Error(`Failed to upload ${folder} file: ${error.message}`);
    }
};
const fileHandler = async (req, res, next) => {
    console.log("entered");
    try {
        const fileFields = [
            { fieldName: "avatar", folder: "the_drop/profile", key: "avatarUrl" },
            { fieldName: "licensePhoto", folder: "the_drop/licensePhoto", key: "licenseUrl" },
            { fieldName: "categoryImage", folder: "the_drop/category", key: "categoryImageUrl" },
            { fieldName: "subcategoryImage", folder: "the_drop/subcategory", key: "subcategoryImageUrl" },
            { fieldName: "cover", folder: "the_drop/cover", key: "coverUrl" },
            { fieldName: "gallery", folder: "the_drop/gallery", key: "galleryUrls" },
        ];
        console.log(req.files);
        if (req.files) {
            await Promise.all(fileFields.map(async ({ fieldName, folder, key }) => {
                const file = req.files[fieldName];
                console.log(file);
                if (file) {
                    if (Array.isArray(file)) {
                        const fileUrls = await Promise.all(file.map(async (fileItem) => await uploadFileToCloudinary(fileItem, folder)));
                        req.body[key] = fileUrls;
                    }
                    else {
                        const fileUrl = await uploadFileToCloudinary(file, folder);
                        req.body[key] = fileUrl;
                    }
                }
            }));
        }
        next();
    }
    catch (error) {
        next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.BAD_REQUEST, error.message));
    }
};
exports.fileHandler = fileHandler;
exports.default = exports.fileHandler;
