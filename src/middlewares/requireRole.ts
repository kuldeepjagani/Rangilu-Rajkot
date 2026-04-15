import { Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { ApiError } from "../utils/apiError";
import { AuthRequest } from "../types";

export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    if (!roles.includes(req.user.role as Role)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }

    next();
  };
};
