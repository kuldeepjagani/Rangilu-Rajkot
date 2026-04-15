import { Request, Response } from "express";
import { userService } from "../services/user.service";
import { updateProfileSchema } from "../validations/user.validation";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../types";
import { uploadToS3 } from "../utils/s3";

export const getPublicProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getPublicProfile(req.params.username);
  ApiResponse.success(res, user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const data = updateProfileSchema.parse(req.body);

  const file = req.file as Express.Multer.File | undefined;
  const avatar = file ? await uploadToS3(file, "avatars") : undefined;

  const user = await userService.updateProfile(authReq.user!.userId, { ...data, avatar });
  ApiResponse.success(res, user, "Profile updated successfully");
});

export const getSavedPosts = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const result = await userService.getSavedPosts(authReq.user!.userId, page, limit);
  ApiResponse.success(res, result.posts, "Saved posts fetched", 200, result.meta);
});

export const getOwnPosts = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const result = await userService.getOwnPosts(authReq.user!.userId, page, limit);
  ApiResponse.success(res, result.posts, "Your posts fetched", 200, result.meta);
});
