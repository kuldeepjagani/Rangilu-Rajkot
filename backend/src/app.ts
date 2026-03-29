import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { config } from "./config";
import { errorHandler } from "./middlewares/errorHandler";
import { generalRateLimiter } from "./middlewares/rateLimiter";

import authRoutes from "./routes/auth.routes";
import postRoutes from "./routes/post.routes";
import commentRoutes from "./routes/comment.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import uploadRoutes from "./routes/upload.routes";

const app = express();

// Global middlewares
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalRateLimiter);

// Serve uploaded files statically
app.use("/uploads", express.static(path.resolve(__dirname, "../", config.upload.dir)));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "RajkotLive API is running", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);

// Gender list API
app.get("/api/genders", (_req, res) => {
  res.json({
    success: true,
    message: "Gender list fetched",
    data: [
      { value: "MALE", label: "Male" },
      { value: "FEMALE", label: "Female" },
      { value: "OTHER", label: "Other" },
    ],
  });
});

// Comment on post route (nested under posts)
import { authenticate } from "./middlewares/authenticate";
import * as commentController from "./controllers/comment.controller";
app.post("/api/posts/:id/comments", authenticate, commentController.addComment);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use(errorHandler);

export default app;
