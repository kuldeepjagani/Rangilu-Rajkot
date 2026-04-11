import mongoose from "mongoose";
import { Post } from "../models";
import { Comment } from "../models";
import { Like } from "../models";
import { SavedPost } from "../models";
import { Report } from "../models";
import { ApiError } from "../utils/apiError";

const authorSelect = "username displayName avatar";

interface CreatePostData {
  title: string;
  content: string;
  category: string;
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
  category?: string;
  subcategory?: string;
  search?: string;
  sort?: "latest" | "popular" | "upcoming";
  page: number;
  limit: number;
}

async function enrichPostWithCounts(post: any) {
  const postId = post._id || post.id;
  const [likesCount, commentsCount] = await Promise.all([
    Like.countDocuments({ postId }),
    Comment.countDocuments({ postId }),
  ]);
  const obj = post.toJSON ? post.toJSON() : { ...post };
  obj._count = { likes: likesCount, comments: commentsCount };
  return obj;
}

async function enrichPostsWithCounts(posts: any[]) {
  return Promise.all(posts.map((p) => enrichPostWithCounts(p)));
}

export class PostService {
  async create(data: CreatePostData) {
    const post = await Post.create({
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
    });

    await post.populate("authorId", authorSelect);

    const postObj = post.toJSON();
    postObj.author = postObj.authorId;
    delete postObj.authorId;

    return { ...postObj, _count: { likes: 0, comments: 0 } };
  }

  async findAll(params: PostQueryParams) {
    const { category, subcategory, search, sort = "latest", page, limit } = params;
    const skip = (page - 1) * limit;

    const filter: any = { status: "ACTIVE" };

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { title: regex },
        { content: regex },
        { tags: { $in: [search.toLowerCase()] } },
      ];
    }

    let sortObj: any = { createdAt: -1 };

    if (sort === "upcoming") {
      sortObj = { eventDate: 1 };
      if (!category) filter.eventDate = { $gte: new Date() };
    }

    let query = Post.find(filter).populate("authorId", authorSelect).skip(skip).limit(limit);

    if (sort === "popular") {
      // For popular sort, get all matching posts, compute like counts, sort manually
      const allPosts = await Post.find(filter).populate("authorId", authorSelect);
      const enriched = await enrichPostsWithCounts(allPosts);

      // Fix author field
      enriched.forEach((p: any) => {
        p.author = p.authorId;
        delete p.authorId;
      });

      enriched.sort((a: any, b: any) => b._count.likes - a._count.likes);
      const paginated = enriched.slice(skip, skip + limit);
      const total = enriched.length;

      return {
        posts: paginated,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }

    query = query.sort(sortObj);

    const [posts, total] = await Promise.all([
      query.exec(),
      Post.countDocuments(filter),
    ]);

    const enriched = await enrichPostsWithCounts(posts);

    // Fix author field
    enriched.forEach((p: any) => {
      p.author = p.authorId;
      delete p.authorId;
    });

    return {
      posts: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.notFound("Post not found");
    }

    const post = await Post.findById(id).populate("authorId", authorSelect);

    if (!post || post.status === "REMOVED") {
      throw ApiError.notFound("Post not found");
    }

    // Get top-level comments
    const topComments = await Comment.find({ postId: id, parentId: null })
      .sort({ createdAt: -1 })
      .populate("authorId", authorSelect);

    // Get replies (level 1)
    const commentIds = topComments.map((c) => c._id);
    const level1Replies = await Comment.find({ parentId: { $in: commentIds } })
      .sort({ createdAt: 1 })
      .populate("authorId", authorSelect);

    // Get replies (level 2)
    const level1Ids = level1Replies.map((c) => c._id);
    const level2Replies = await Comment.find({ parentId: { $in: level1Ids } })
      .sort({ createdAt: 1 })
      .populate("authorId", authorSelect);

    // Build nested structure
    const formatComment = (c: any) => {
      const obj = c.toJSON();
      obj.author = obj.authorId;
      obj.authorId = c.authorId._id || c.authorId;
      return obj;
    };

    const level2Map = new Map<string, any[]>();
    for (const r of level2Replies) {
      const pid = r.parentId!.toString();
      if (!level2Map.has(pid)) level2Map.set(pid, []);
      level2Map.get(pid)!.push({ ...formatComment(r), replies: [] });
    }

    const level1Map = new Map<string, any[]>();
    for (const r of level1Replies) {
      const pid = r.parentId!.toString();
      if (!level1Map.has(pid)) level1Map.set(pid, []);
      level1Map.get(pid)!.push({
        ...formatComment(r),
        replies: level2Map.get(r._id.toString()) || [],
      });
    }

    const comments = topComments.map((c) => ({
      ...formatComment(c),
      replies: level1Map.get(c._id.toString()) || [],
    }));

    // Increment view count
    await Post.updateOne({ _id: id }, { $inc: { viewCount: 1 } });

    const [likesCount, commentsCount] = await Promise.all([
      Like.countDocuments({ postId: id }),
      Comment.countDocuments({ postId: id }),
    ]);

    const postObj = post.toJSON();
    postObj.author = postObj.authorId;
    delete postObj.authorId;

    return {
      ...postObj,
      comments,
      _count: { likes: likesCount, comments: commentsCount },
    };
  }

  async update(id: string, userId: string, data: Partial<CreatePostData>) {
    const post = await Post.findById(id);

    if (!post) throw ApiError.notFound("Post not found");
    if (post.authorId.toString() !== userId) throw ApiError.forbidden("You can only edit your own posts");

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.content) updateData.content = data.content;
    if (data.category) updateData.category = data.category;
    if (data.subcategory !== undefined) updateData.subcategory = data.subcategory;
    if (data.tags) updateData.tags = data.tags;
    if (data.eventDate !== undefined) updateData.eventDate = data.eventDate ? new Date(data.eventDate) : null;
    if (data.eventVenue !== undefined) updateData.eventVenue = data.eventVenue;
    if (data.isOngoing !== undefined) updateData.isOngoing = data.isOngoing;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.locationCoordinate !== undefined) updateData.locationCoordinate = data.locationCoordinate;
    if (data.images) updateData.images = data.images;

    const updated = await Post.findByIdAndUpdate(id, updateData, { new: true }).populate("authorId", authorSelect);

    const enriched = await enrichPostWithCounts(updated);
    enriched.author = enriched.authorId;
    delete enriched.authorId;

    return enriched;
  }

  async delete(id: string, userId: string, userRole: string) {
    const post = await Post.findById(id);

    if (!post) throw ApiError.notFound("Post not found");

    if (post.authorId.toString() !== userId && userRole !== "ADMIN") {
      throw ApiError.forbidden("You do not have permission to delete this post");
    }

    // Cascade delete related data
    await Promise.all([
      Comment.deleteMany({ postId: id }),
      Like.deleteMany({ postId: id }),
      SavedPost.deleteMany({ postId: id }),
      Report.deleteMany({ postId: id }),
      Post.findByIdAndDelete(id),
    ]);
  }

  async toggleLike(postId: string, userId: string) {
    const post = await Post.findById(postId);
    if (!post) throw ApiError.notFound("Post not found");

    const existingLike = await Like.findOne({ userId, postId });

    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      return { liked: false };
    }

    await Like.create({ userId, postId });
    return { liked: true };
  }

  async toggleSave(postId: string, userId: string) {
    const post = await Post.findById(postId);
    if (!post) throw ApiError.notFound("Post not found");

    const existingSave = await SavedPost.findOne({ userId, postId });

    if (existingSave) {
      await SavedPost.findByIdAndDelete(existingSave._id);
      return { saved: false };
    }

    await SavedPost.create({ userId, postId });
    return { saved: true };
  }

  async reportPost(postId: string, userId: string, reason?: string) {
    const post = await Post.findById(postId);
    if (!post) throw ApiError.notFound("Post not found");

    if (post.authorId.toString() === userId) {
      throw ApiError.badRequest("You cannot report your own post");
    }

    const existingReport = await Report.findOne({ userId, postId });

    if (existingReport) {
      throw ApiError.conflict("You have already reported this post");
    }

    const report = await Report.create({ userId, postId, reason });

    return report.toJSON();
  }
}

export const postService = new PostService();
