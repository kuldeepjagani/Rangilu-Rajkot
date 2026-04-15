import { Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { ApiError } from "../utils/apiError";
import { AuthRequest } from "../types";
import { User } from "../models";

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Access token is required");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select("_id role status");

    if (!user) {
      throw ApiError.unauthorized("User no longer exists");
    }

    if (user.status === "INACTIVE") {
      throw ApiError.forbidden("Your account has been suspended. Contact admin for support.");
    }

    req.user = { userId: user._id.toString(), role: user.role as any };
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized("Invalid or expired access token"));
    }
  }
};
