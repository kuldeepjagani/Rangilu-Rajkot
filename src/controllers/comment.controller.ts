import { Request, Response } from "express";
import { commentService } from "../services/comment.service";
import { createCommentSchema, replyCommentSchema } from "../validations/comment.validation";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../types";

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const postId = req.params.id as string;
  const { content } = createCommentSchema.parse(req.body);
  const comment = await commentService.create(postId, authReq.user!.userId, content);
  ApiResponse.created(res, comment, "Comment added successfully");
});

export const replyToComment = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const commentId = req.params.id as string;
  const { content } = replyCommentSchema.parse(req.body);
  const reply = await commentService.reply(commentId, authReq.user!.userId, content);
  ApiResponse.created(res, reply, "Reply added successfully");
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const commentId = req.params.id as string;
  await commentService.delete(commentId, authReq.user!.userId, authReq.user!.role);
  ApiResponse.success(res, null, "Comment deleted successfully");
});
