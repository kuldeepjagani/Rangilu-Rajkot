import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { ZodError } from "zod";
import { config } from "../config";

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Multer errors
  if (err.name === "MulterError") {
    const multerErr = err as any;
    let message = "File upload error";

    if (multerErr.code === "LIMIT_FILE_SIZE") message = "File size exceeds the 5MB limit";
    if (multerErr.code === "LIMIT_FILE_COUNT") message = "Maximum 4 files allowed";
    if (multerErr.code === "LIMIT_UNEXPECTED_FILE") message = "Unexpected file field";

    return res.status(400).json({ success: false, message });
  }

  console.error("Unhandled error:", err);

  return res.status(500).json({
    success: false,
    message: config.isDev ? err.message : "Internal server error",
  });
};
