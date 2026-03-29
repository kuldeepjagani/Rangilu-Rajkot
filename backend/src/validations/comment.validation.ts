import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000, "Comment is too long"),
});

export const replyCommentSchema = z.object({
  content: z.string().min(1, "Reply cannot be empty").max(2000, "Reply is too long"),
});
