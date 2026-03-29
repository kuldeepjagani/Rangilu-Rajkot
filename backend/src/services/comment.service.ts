import prisma from "../lib/prisma";
import { ApiError } from "../utils/apiError";

export class CommentService {
  async create(postId: string, authorId: string, content: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw ApiError.notFound("Post not found");

    const comment = await prisma.comment.create({
      data: { content, authorId, postId },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    return comment;
  }

  async reply(commentId: string, authorId: string, content: string) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { parent: true },
    });

    if (!parentComment) throw ApiError.notFound("Comment not found");

    // Max 2 levels of nesting: if parent already has a parent, block further nesting
    if (parentComment.parentId && parentComment.parent?.parentId) {
      throw ApiError.badRequest("Maximum reply depth (2 levels) reached");
    }

    const reply = await prisma.comment.create({
      data: {
        content,
        authorId,
        postId: parentComment.postId,
        parentId: commentId,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    return reply;
  }

  async delete(commentId: string, userId: string, userRole: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) throw ApiError.notFound("Comment not found");

    if (comment.authorId !== userId && userRole !== "ADMIN") {
      throw ApiError.forbidden("You can only delete your own comments");
    }

    await prisma.comment.delete({ where: { id: commentId } });
  }
}

export const commentService = new CommentService();
