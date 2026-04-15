import { PostStatus, Prisma, Role, UserStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { ApiError } from "../utils/apiError";

interface PostFilters {
  search?: string;
  category?: string;
  status?: string;
  reported?: boolean;
  page: number;
  limit: number;
}

interface UserFilters {
  search?: string;
  status?: string;
  role?: string;
  page: number;
  limit: number;
}

export class AdminService {
  // ─── Posts ───────────────────────────────────────────

  async getAllPosts(filters: PostFilters) {
    const { search, category, status, reported, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { displayName: { contains: search, mode: "insensitive" } } },
        { author: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (category) where.category = category as any;
    if (status) where.status = status as PostStatus;
    if (reported) where.reports = { some: {} };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
          _count: { select: { likes: true, comments: true, reports: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updatePostStatus(postId: string, status: PostStatus) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw ApiError.notFound("Post not found");

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { status },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        _count: { select: { likes: true, comments: true, reports: true } },
      },
    });

    return updated;
  }

  async deletePost(postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw ApiError.notFound("Post not found");

    await prisma.post.delete({ where: { id: postId } });
  }

  // ─── Reported Posts ──────────────────────────────────

  async getReportedPosts(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = { reports: { some: {} } };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
          reports: {
            include: {
              user: { select: { id: true, username: true, displayName: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { likes: true, comments: true, reports: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async dismissReports(postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw ApiError.notFound("Post not found");

    await prisma.report.deleteMany({ where: { postId } });

    return { postId, message: "All reports dismissed" };
  }

  // ─── Users ──────────────────────────────────────────

  async getAllUsers(filters: UserFilters) {
    const { search, status, role, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) where.status = status as UserStatus;
    if (role) where.role = role as Role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatar: true,
          gender: true,
          role: true,
          status: true,
          createdAt: true,
          _count: { select: { posts: true, comments: true, likes: true, reports: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateUserRole(userId: string, role: Role) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
      },
    });

    return updated;
  }

  async toggleBanUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");

    if (user.role === Role.ADMIN) {
      throw ApiError.badRequest("Cannot ban an admin user");
    }

    const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
      },
    });

    return updated;
  }

  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");

    if (user.role === Role.ADMIN) {
      throw ApiError.badRequest("Cannot delete an admin user");
    }

    await prisma.user.delete({ where: { id: userId } });
  }

  // ─── Stats ──────────────────────────────────────────

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPosts,
      todayPosts,
      removedPosts,
      totalUsers,
      bannedUsers,
      totalReports,
      reportedPostsCount,
    ] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { createdAt: { gte: today } } }),
      prisma.post.count({ where: { status: PostStatus.REMOVED } }),
      prisma.user.count(),
      prisma.user.count({ where: { status: UserStatus.INACTIVE } }),
      prisma.report.count(),
      prisma.post.count({ where: { reports: { some: {} } } }),
    ]);

    return {
      totalPosts,
      todayPosts,
      removedPosts,
      totalUsers,
      bannedUsers,
      totalReports,
      reportedPostsCount,
    };
  }
}

export const adminService = new AdminService();
