import { Router } from "express";
import * as commentController from "../controllers/comment.controller";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

router.delete("/:id", authenticate, commentController.deleteComment);
router.post("/:id/reply", authenticate, commentController.replyToComment);

export default router;
