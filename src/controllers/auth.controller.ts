import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { registerSchema, loginSchema, refreshTokenSchema } from "../validations/auth.validation";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../types";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const result = await authService.register(data);
  ApiResponse.created(res, result, "Registration successful");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await authService.login(email, password);
  ApiResponse.success(res, result, "Login successful");
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = refreshTokenSchema.parse(req.body);
  const tokens = await authService.refreshToken(refreshToken);
  ApiResponse.success(res, tokens, "Token refreshed successfully");
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  ApiResponse.success(res, null, "Logged out successfully");
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const user = await authService.getMe(authReq.user!.userId);
  ApiResponse.success(res, user);
});
