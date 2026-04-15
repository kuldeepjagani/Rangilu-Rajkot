import { User } from "../models";
import { Post } from "../models";
import { Comment } from "../models";
import { Like } from "../models";
import { SavedPost } from "../models";
import { Report } from "../models";
import { ApiError } from "../utils/apiError";

const authorSelect = "username displayName avatar";

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

    const filter: any = {};

    if (search) {
      const regex = new RegExp(search, "i");
      // First find matching user IDs
      const matchingUsers = await User.find({
      }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { title: regex },
        { authorId: { $in: userIds } },
      ];
    }

    if (category) filter.category = category;
    if (status) filter.status = status;

    // If reported filter, find post IDs that have reports
    if (reported) {
      const reportedPostIds = await Report.distinct("postId");
      filter._id = { $in: reportedPostIds };
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("authorId", authorSelect),
      Post.countDocuments(filter),
    ]);

    const enriched = await Promise.all(
      posts.map(async (p) => {
        const postId = p._id;
        const [likesCount, commentsCount, reportsCount] = await Promise.all([
          Like.countDocuments({ postId }),
          Comment.countDocuments({ postId }),
          Report.countDocuments({ postId }),
        ]);
        const obj: any = p.toJSON();
        obj.author = obj.authorId;
        delete obj.authorId;
        obj._count = { likes: likesCount, comments: commentsCount, reports: reportsCount };
        return obj;
      })
    );

    return {
      posts: enriched,
    };
  }

  // ─── Reported Posts ──────────────────────────────────

  async getReportedPosts(page: number, limit: number) {
    const skip = (page - 1) * limit;

    // Find post IDs that have reports
    const reportedPostIds = await Report.distinct("postId");

    const filter = { _id: { $in: reportedPostIds } };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("authorId", authorSelect),
      Post.countDocuments(filter),
    ]);

    const enriched = await Promise.all(
      posts.map(async (p) => {
        const postId = p._id;
        const [likesCount, commentsCount, reports] = await Promise.all([
          Like.countDocuments({ postId }),
          Comment.countDocuments({ postId }),
          Report.find({ postId })
            .sort({ createdAt: -1 })
            .populate("userId", "username displayName"),
        ]);

        const formattedReports = reports.map((r) => {
          const rObj: any = r.toJSON();
          rObj.user = rObj.userId;
          delete rObj.userId;
          return rObj;
        });

        const obj: any = p.toJSON();
        obj.author = obj.authorId;
        delete obj.authorId;
        obj.reports = formattedReports;
        obj._count = { likes: likesCount, comments: commentsCount, reports: reports.length };
        return obj;
      })
    );

    return {
      posts: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async dismissReports(postId: string) {
    const post = await Post.findById(postId);
    if (!post) throw ApiError.notFound("Post not found");

    await Report.deleteMany({ postId });

    return { postId, message: "All reports dismissed" };
  }

  // ─── Users ──────────────────────────────────────────

  async getAllUsers(filters: UserFilters) {
    const { search, status, role, page, limit } = filters;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { username: regex },
        { displayName: regex },
        { email: regex },
      ];
    }

    if (status) filter.status = status;
    if (role) filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password"),
      User.countDocuments(filter),
    ]);

    const enriched = await Promise.all(
      users.map(async (u) => {
        const userId = u._id;
        const [postsCount, commentsCount, likesCount, reportsCount] = await Promise.all([
          Post.countDocuments({ authorId: userId }),
          Comment.countDocuments({ authorId: userId }),
          Like.countDocuments({ userId }),
          Report.countDocuments({ userId }),
        ]);
        const obj: any = u.toJSON();
        obj._count = { posts: postsCount, comments: commentsCount, likes: likesCount, reports: reportsCount };
        return obj;
      })
    );

    return {
      users: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateUserRole(userId: string, role: string) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    const updated = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("username email displayName role status");

    return updated!.toJSON();
  }

  async toggleBanUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    if (user.role === "ADMIN") {
      throw ApiError.badRequest("Cannot ban an admin user");
    }

    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const updated = await User.findByIdAndUpdate(userId, { status: newStatus }, { new: true })
      .select("username email displayName role status");

    return updated!.toJSON();
  }

  async deleteUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    if (user.role === "ADMIN") {
      throw ApiError.badRequest("Cannot delete an admin user");
    }

    // Get all post IDs by this user for cascade
    const userPostIds = await Post.find({ authorId: userId }).select("_id").then((p) => p.map((x) => x._id));

    // Cascade delete all user data
    await Promise.all([
      Comment.deleteMany({ $or: [{ authorId: userId }, { postId: { $in: userPostIds } }] }),
      Like.deleteMany({ $or: [{ userId }, { postId: { $in: userPostIds } }] }),
      SavedPost.deleteMany({ $or: [{ userId }, { postId: { $in: userPostIds } }] }),
      Report.deleteMany({ $or: [{ userId }, { postId: { $in: userPostIds } }] }),
      Post.deleteMany({ authorId: userId }),
      User.findByIdAndDelete(userId),
    ]);
  }

  // ─── Stats ──────────────────────────────────────────

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reportedPostIds = await Report.distinct("postId");

    const [
      totalPosts,
      todayPosts,
      removedPosts,
      totalUsers,
      bannedUsers,
      totalReports,
    ] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ createdAt: { $gte: today } }),
      Post.countDocuments({ status: "REMOVED" }),
      User.countDocuments(),
      User.countDocuments({ status: "INACTIVE" }),
      Report.countDocuments(),
    ]);

    return {
      totalPosts,
      todayPosts,
      removedPosts,
      totalUsers,
      bannedUsers,
      totalReports,
      reportedPostsCount: reportedPostIds.length,
    };
  }
}

export const adminService = new AdminService();
