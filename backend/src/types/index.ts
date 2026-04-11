import { Request } from "express";

export type Role = "USER" | "ADMIN";

export interface AuthUser {
  userId: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface PostFilterQuery extends PaginationQuery {
  category?: string;
  subcategory?: string;
  search?: string;
  sort?: "latest" | "popular" | "upcoming";
}
