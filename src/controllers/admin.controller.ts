import { Request, Response } from "express";
import { PostStatus, Role } from "@prisma/client";
import { adminService } from "../services/admin.service";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";

// ─── Posts ────────────────────────────────────────────

export const getAllPosts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);
  const search = req.query.search as string | undefined;
  const category = req.query.category as string | undefined;
  const status = req.query.status as string | undefined;
  const reported = req.query.reported === "true";

  const result = await adminService.getAllPosts({ search, category, status, reported, page, limit });
  ApiResponse.success(res, result.posts, "All posts fetched", 200, result.meta);
});

export const updatePostStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;

  if (!status || !Object.values(PostStatus).includes(status)) {
    throw ApiError.badRequest("Invalid status. Must be ACTIVE or REMOVED");
  }

  const post = await adminService.updatePostStatus(req.params.id, status as PostStatus);
  ApiResponse.success(res, post, "Post status updated successfully");
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deletePost(req.params.id);
  ApiResponse.success(res, null, "Post deleted successfully");
});

// ─── Reported Posts ───────────────────────────────────

export const getReportedPosts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const result = await adminService.getReportedPosts(page, limit);
  ApiResponse.success(res, result.posts, "Reported posts fetched", 200, result.meta);
});

export const dismissReports = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.dismissReports(req.params.id);
  ApiResponse.success(res, result, "Reports dismissed successfully");
});

// ─── Users ────────────────────────────────────────────

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);
  const search = req.query.search as string | undefined;
  const status = req.query.status as string | undefined;
  const role = req.query.role as string | undefined;

  const result = await adminService.getAllUsers({ search, status, role, page, limit });
  ApiResponse.success(res, result.users, "All users fetched", 200, result.meta);
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body;

  if (!role || !Object.values(Role).includes(role)) {
    throw ApiError.badRequest("Invalid role. Must be USER or ADMIN");
  }

  const user = await adminService.updateUserRole(req.params.id, role as Role);
  ApiResponse.success(res, user, "User role updated successfully");
});

export const toggleBanUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.toggleBanUser(req.params.id);
  const action = user.status === "INACTIVE" ? "banned" : "unbanned";
  ApiResponse.success(res, user, `User ${action} successfully`);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await adminService.deleteUser(req.params.id);
  ApiResponse.success(res, null, "User and all associated data deleted successfully");
});

// ─── Stats ────────────────────────────────────────────

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminService.getStats();
  ApiResponse.success(res, stats, "Dashboard stats fetched");
});
