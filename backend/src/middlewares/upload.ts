import multer from "multer";
import { Request } from "express";
import { config } from "../config";
import { ApiError } from "../utils/apiError";

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest("Only JPEG, PNG, GIF, and WebP images are allowed"));
  }
};

export const uploadImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: config.upload.maxFiles,
  },
}).array("images", config.upload.maxFiles);

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 1,
  },
}).single("avatar");
