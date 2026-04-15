import { Router, Request, Response } from "express";
import { authenticate } from "../middlewares/authenticate";
import { uploadImages, uploadAvatar } from "../middlewares/upload";
import { uploadToS3 } from "../utils/s3";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

const router = Router();

router.post(
  "/",
  authenticate,
  uploadImages,
  asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw ApiError.badRequest("At least one image file is required");
    }

    const fileType = (req.body.fileType as string) || "post_image";

    const folder = fileType === "avatar" ? "avatars" : "posts";

    const results = await Promise.all(
      files.map(async (file) => {
        const url = await uploadToS3(file, folder);
        return {
          url,
          fileType,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        };
      })
    );

    ApiResponse.success(res, results, "Images uploaded successfully");
  })
);

router.post(
  "/avatar",
  authenticate,
  uploadAvatar,
  asyncHandler(async (req: Request, res: Response) => {
    const file = req.file as Express.Multer.File | undefined;

    if (!file) {
      throw ApiError.badRequest("Avatar image is required");
    }

    const url = await uploadToS3(file, "avatars");

    ApiResponse.success(
      res,
      { url, fileType: "avatar", originalName: file.originalname, size: file.size, mimeType: file.mimetype },
      "Avatar uploaded successfully"
    );
  })
);

export default router;
