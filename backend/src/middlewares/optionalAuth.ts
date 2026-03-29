import { Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AuthRequest } from "../types";

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyAccessToken(token);
      req.user = { userId: decoded.userId, role: decoded.role as any };
    }
  } catch {
    // Token invalid or expired — continue as guest
  }

  next();
};
