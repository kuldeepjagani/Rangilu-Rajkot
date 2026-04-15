import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middlewares/authenticate";
import { uploadAvatar } from "../middlewares/upload";

const router = Router();

router.get("/me/saved", authenticate, userController.getSavedPosts);
router.get("/me/posts", authenticate, userController.getOwnPosts);
router.put("/me", authenticate, uploadAvatar, userController.updateProfile);
router.get("/:username", userController.getPublicProfile);

export default router;
