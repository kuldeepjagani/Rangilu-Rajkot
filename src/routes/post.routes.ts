import { Router } from "express";
import * as postController from "../controllers/post.controller";
import { authenticate } from "../middlewares/authenticate";
import { optionalAuth } from "../middlewares/optionalAuth";

const router = Router();

router.get("/", optionalAuth, postController.getAllPosts);
router.get("/:id", optionalAuth, postController.getPostById);
router.post("/", authenticate, postController.createPost);
router.put("/:id", authenticate, postController.updatePost);
router.delete("/:id", authenticate, postController.deletePost);
router.post("/:id/like", authenticate, postController.toggleLike);
router.post("/:id/save", authenticate, postController.toggleSave);
router.post("/:id/report", authenticate, postController.reportPost);

export default router;
