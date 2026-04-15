import { Post } from "../models";
import { Comment } from "../models";
import { ApiError } from "../utils/apiError";

const authorSelect = "username displayName avatar";

export class CommentService {
  async create(postId: string, authorId: string, content: string) {
    const post = await Post.findById(postId);
    if (!post) throw ApiError.notFound("Post not found");

    const comment = await Comment.create({ content, authorId, postId });
    await comment.populate("authorId", authorSelect);

    const obj: any = comment.toJSON();
    obj.author = obj.authorId;
    delete obj.authorId;

    return obj;
  }

  async reply(commentId: string, authorId: string, content: string) {
    const parentComment = await Comment.findById(commentId);

    if (!parentComment) throw ApiError.notFound("Comment not found");

    // Max 2 levels of nesting: if parent already has a parent, block further nesting
    if (parentComment.parentId) {
      const grandParent = await Comment.findById(parentComment.parentId);
      if (grandParent?.parentId) {
        throw ApiError.badRequest("Maximum reply depth (2 levels) reached");
      }
    }

    const reply = await Comment.create({
      content,
      authorId,
      postId: parentComment.postId,
      parentId: commentId,
    });

    await reply.populate("authorId", authorSelect);

    const obj: any = reply.toJSON();
    obj.author = obj.authorId;
    delete obj.authorId;

    return obj;
  }

  async delete(commentId: string, userId: string, userRole: string) {
    const comment = await Comment.findById(commentId);

    if (!comment) throw ApiError.notFound("Comment not found");

    if (comment.authorId.toString() !== userId && userRole !== "ADMIN") {
      throw ApiError.forbidden("You can only delete your own comments");
    }

    // Delete the comment and all its replies (cascade)
    const childIds = await Comment.find({ parentId: commentId }).select("_id");
    const grandChildIds = await Comment.find({ parentId: { $in: childIds.map((c) => c._id) } }).select("_id");

    await Comment.deleteMany({
      _id: { $in: [commentId, ...childIds.map((c) => c._id), ...grandChildIds.map((c) => c._id)] },
    });
  }
}

export const commentService = new CommentService();
