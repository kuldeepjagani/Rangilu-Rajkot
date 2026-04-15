import { Router } from "express";
import { Role } from "@prisma/client";
import * as adminController from "../controllers/admin.controller";
import { authenticate } from "../middlewares/authenticate";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

router.use(authenticate, requireRole(Role.ADMIN));

// Dashboard
router.get("/stats", adminController.getStats);

// Posts management
router.get("/posts", adminController.getAllPosts);
router.put("/posts/:id/status", adminController.updatePostStatus);
router.delete("/posts/:id", adminController.deletePost);

// Reported posts
router.get("/reports", adminController.getReportedPosts);
router.delete("/reports/:id/dismiss", adminController.dismissReports);

// User management
router.get("/users", adminController.getAllUsers);
router.put("/users/:id/role", adminController.updateUserRole);
router.put("/users/:id/ban", adminController.toggleBanUser);
router.delete("/users/:id", adminController.deleteUser);

export default router;
