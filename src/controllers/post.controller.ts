import { Request, Response } from "express";
import { postService } from "../services/post.service";
import { createPostSchema, updatePostSchema, postQuerySchema } from "../validations/post.validation";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../types";
import { PostCategory } from "@prisma/client";

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const data = createPostSchema.parse(req.body);

  const post = await postService.create({
    ...data,
    images: data.images || [],
    authorId: authReq.user!.userId,
  });

  ApiResponse.created(res, post, "Post created successfully");
});

export const getAllPosts = asyncHandler(async (req: Request, res: Response) => {
  const query = postQuerySchema.parse(req.query);

  const page = parseInt(query.page || "1", 10);
  const limit = parseInt(query.limit || "10", 10);

  const result = await postService.findAll({
    category: query.category as PostCategory | undefined,
    subcategory: query.subcategory,
    search: query.search,
    sort: query.sort,
    page,
    limit,
  });

  ApiResponse.success(res, result.posts, "Posts fetched successfully", 200, result.meta);
});

export const getPostById = asyncHandler(async (req: Request, res: Response) => {
  const post = await postService.findById(req.params.id);
  ApiResponse.success(res, post);
});

export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const data = updatePostSchema.parse(req.body);

  const post = await postService.update(req.params.id, authReq.user!.userId, {
    ...data,
    ...(data.images && { images: data.images }),
  });

  ApiResponse.success(res, post, "Post updated successfully");
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  await postService.delete(req.params.id, authReq.user!.userId, authReq.user!.role);
  ApiResponse.success(res, null, "Post deleted successfully");
});

export const toggleLike = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = await postService.toggleLike(req.params.id, authReq.user!.userId);
  ApiResponse.success(res, result, result.liked ? "Post liked" : "Post unliked");
});

export const toggleSave = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = await postService.toggleSave(req.params.id, authReq.user!.userId);
  ApiResponse.success(res, result, result.saved ? "Post saved" : "Post unsaved");
});

export const reportPost = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { reason } = req.body;
  const result = await postService.reportPost(req.params.id, authReq.user!.userId, reason);
  ApiResponse.created(res, result, "Post reported successfully");
});
