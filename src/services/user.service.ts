import { User } from "../models";
import { Post } from "../models";
import { Like } from "../models";
import { Comment } from "../models";
import { SavedPost } from "../models";
import { ApiError } from "../utils/apiError";

const authorSelect = "username displayName avatar";

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

export class UserService {
  async getPublicProfile(username: string) {
    const user = await User.findOne({ username }).select("-password");

    if (!user) throw ApiError.notFound("User not found");

    const userId = user._id.toString();

    // Get post count and recent posts
    const [postsCount, recentPosts, likesReceived] = await Promise.all([
      Post.countDocuments({ authorId: userId }),
      Post.find({ authorId: userId, status: "ACTIVE" })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title category createdAt"),
      Like.countDocuments({ postId: { $in: await Post.find({ authorId: userId }).select("_id").then(p => p.map(x => x._id)) } }),
    ]);

    // Enrich recent posts with counts
    const postsWithCounts = await Promise.all(
      recentPosts.map(async (p) => {
        const [likes, comments] = await Promise.all([
          Like.countDocuments({ postId: p._id }),
          Comment.countDocuments({ postId: p._id }),
        ]);
        const obj = p.toJSON();
        return { ...obj, _count: { likes, comments } };
      })
    );

    const userObj = user.toJSON();

    return {
      ...userObj,
      _count: { posts: postsCount },
      posts: postsWithCounts,
      likesReceived,
    };
  }

  async updateProfile(userId: string, data: { displayName?: string; bio?: string; avatar?: string; gender?: string }) {
    const updateData: any = {};
    if (data.displayName) updateData.displayName = data.displayName;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatar) updateData.avatar = data.avatar;
    if (data.gender) updateData.gender = data.gender;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");

    if (!user) throw ApiError.notFound("User not found");

    return user.toJSON();
  }

  async getSavedPosts(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [savedPosts, total] = await Promise.all([
      SavedPost.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "postId",
          populate: { path: "authorId", select: authorSelect },
        }),
      SavedPost.countDocuments({ userId }),
    ]);

    const posts = await Promise.all(
      savedPosts.map(async (sp) => {
        const post = sp.postId as any;
        if (!post) return null;
        const enriched = await enrichPostWithCounts(post);
        enriched.author = enriched.authorId;
        delete enriched.authorId;
        return enriched;
      })
    );

    return {
      posts: posts.filter(Boolean),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getOwnPosts(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ authorId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("authorId", authorSelect),
      Post.countDocuments({ authorId: userId }),
    ]);

    const enriched = await Promise.all(
      posts.map(async (p) => {
        const obj = await enrichPostWithCounts(p);
        obj.author = obj.authorId;
        delete obj.authorId;
        return obj;
      })
    );

    return {
      posts: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}

export const userService = new UserService();
