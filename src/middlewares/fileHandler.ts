import Cloudinary from "@shared/cloudinary";
import { NextFunction, Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";

const uploadFileToCloudinary = async (file: UploadedFile, folder: string): Promise<string> => {
  try {
    return await Cloudinary.upload(file, folder);
  } catch (error: any) {
    throw new Error(`Failed to upload ${folder} file: ${error.message}`);
  }
};

export const fileHandler = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
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
      await Promise.all(
        fileFields.map(async ({ fieldName, folder, key }) => {
          const file = req.files[fieldName];
          console.log(file);

          if (file) {
            if (Array.isArray(file)) {
              const fileUrls = await Promise.all(
                file.map(async (fileItem: UploadedFile) => await uploadFileToCloudinary(fileItem, folder))
              );
              req.body[key] = fileUrls;
            } else {
              const fileUrl = await uploadFileToCloudinary(file as UploadedFile, folder);
              req.body[key] = fileUrl;
            }
          }
        })
      );
    }

    next();
  } catch (error: any) {
    next(createError(StatusCodes.BAD_REQUEST, error.message));
  }
};

export default fileHandler;
