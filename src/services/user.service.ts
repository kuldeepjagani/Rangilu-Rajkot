import prisma from "../lib/prisma";
import { ApiError } from "../utils/apiError";

export class UserService {
  async getPublicProfile(username: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        gender: true,
        role: true,
        createdAt: true,
        _count: { select: { posts: true } },
        posts: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            category: true,
            createdAt: true,
            _count: { select: { likes: true, comments: true } },
          },
        },
      },
    });

    if (!user) throw ApiError.notFound("User not found");

    // Calculate total likes received on all user posts
    const likesReceived = await prisma.like.count({
      where: { post: { authorId: user.id } },
    });

    return { ...user, likesReceived };
  }

  async updateProfile(userId: string, data: { displayName?: string; bio?: string; avatar?: string; gender?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatar && { avatar: data.avatar }),
        ...(data.gender && { gender: data.gender as any }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        bio: true,
        gender: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async getSavedPosts(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [savedPosts, total] = await Promise.all([
      prisma.savedPost.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          post: {
            include: {
              author: {
                select: { id: true, username: true, displayName: true, avatar: true },
              },
              _count: { select: { likes: true, comments: true } },
            },
          },
        },
      }),
      prisma.savedPost.count({ where: { userId } }),
    ]);

    return {
      posts: savedPosts.map((sp) => sp.post),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getOwnPosts(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.post.count({ where: { authorId: userId } }),
    ]);

    return {
      posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}

export const userService = new UserService();
