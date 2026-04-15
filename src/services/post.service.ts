import { PostCategory, PostStatus, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { ApiError } from "../utils/apiError";

interface CreatePostData {
  title: string;
  content: string;
  category: PostCategory;
  subcategory?: string;
  tags?: string[];
  eventDate?: string;
  eventVenue?: string;
  isOngoing?: boolean;
  address?: string;
  locationCoordinate?: string;
  images: string[];
  authorId: string;
}

interface PostQueryParams {
  category?: PostCategory;
  subcategory?: string;
  search?: string;
  sort?: "latest" | "popular" | "upcoming";
  page: number;
  limit: number;
}

export class PostService {
  async create(data: CreatePostData) {
    const post = await prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        subcategory: data.subcategory,
        tags: data.tags || [],
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        eventVenue: data.eventVenue,
        isOngoing: data.isOngoing || false,
        address: data.address,
        locationCoordinate: data.locationCoordinate,
        images: data.images,
        authorId: data.authorId,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return post;
  }

  async findAll(params: PostQueryParams) {
    const { category, subcategory, search, sort = "latest", page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = { status: PostStatus.ACTIVE };

    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search.toLowerCase()] } },
      ];
    }

    let orderBy: Prisma.PostOrderByWithRelationInput;

    switch (sort) {
      case "popular":
        orderBy = { likes: { _count: "desc" } };
        break;
      case "upcoming":
        orderBy = { eventDate: "asc" };
        if (!category) where.eventDate = { gte: new Date() };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
            replies: {
              orderBy: { createdAt: "asc" },
              include: {
                author: {
                  select: { id: true, username: true, displayName: true, avatar: true },
                },
                replies: {
                  orderBy: { createdAt: "asc" },
                  include: {
                    author: {
                      select: { id: true, username: true, displayName: true, avatar: true },
                    },
                  },
                },
              },
            },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!post || post.status === PostStatus.REMOVED) {
      throw ApiError.notFound("Post not found");
    }

    // Increment view count
    await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return post;
  }

  async update(id: string, userId: string, data: Partial<CreatePostData>) {
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) throw ApiError.notFound("Post not found");
    if (post.authorId !== userId) throw ApiError.forbidden("You can only edit your own posts");

    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.category && { category: data.category }),
        ...(data.subcategory !== undefined && { subcategory: data.subcategory }),
        ...(data.tags && { tags: data.tags }),
        ...(data.eventDate !== undefined && { eventDate: data.eventDate ? new Date(data.eventDate) : null }),
        ...(data.eventVenue !== undefined && { eventVenue: data.eventVenue }),
        ...(data.isOngoing !== undefined && { isOngoing: data.isOngoing }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.locationCoordinate !== undefined && { locationCoordinate: data.locationCoordinate }),
        ...(data.images && { images: data.images }),
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return updated;
  }

  async delete(id: string, userId: string, userRole: string) {
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) throw ApiError.notFound("Post not found");

    if (post.authorId !== userId && userRole !== "ADMIN") {
      throw ApiError.forbidden("You do not have permission to delete this post");
    }

    await prisma.post.delete({ where: { id } });
  }

  async toggleLike(postId: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw ApiError.notFound("Post not found");

    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      return { liked: false };
    }

    await prisma.like.create({ data: { userId, postId } });
    return { liked: true };
  }

  async toggleSave(postId: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw ApiError.notFound("Post not found");

    const existingSave = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingSave) {
      await prisma.savedPost.delete({ where: { id: existingSave.id } });
      return { saved: false };
    }

    await prisma.savedPost.create({ data: { userId, postId } });
    return { saved: true };
  }
  async reportPost(postId: string, userId: string, reason?: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw ApiError.notFound("Post not found");

    if (post.authorId === userId) {
      throw ApiError.badRequest("You cannot report your own post");
    }

    const existingReport = await prisma.report.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingReport) {
      throw ApiError.conflict("You have already reported this post");
    }

    const report = await prisma.report.create({
      data: { userId, postId, reason },
    });

    return report;
  }
}

export const postService = new PostService();
