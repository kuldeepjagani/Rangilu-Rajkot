import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { ApiError } from "../utils/apiError";
import { generateTokenPair, verifyRefreshToken } from "../utils/jwt";

const SALT_ROUNDS = 12;

export class AuthService {
  async register(data: { username: string; email: string; password: string; displayName: string; gender?: string }) {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });

    if (existingUser) {
      const field = existingUser.email === data.email ? "Email" : "Username";
      throw ApiError.conflict(`${field} already exists`);
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        displayName: data.displayName,
        ...(data.gender && { gender: data.gender as any }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        gender: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = generateTokenPair({ userId: user.id, role: user.role });

    return { user, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const tokens = generateTokenPair({ userId: user.id, role: user.role });

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, ...tokens };
  }

  async refreshToken(refreshToken: string) {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw ApiError.unauthorized("User no longer exists");
    }

    const tokens = generateTokenPair({ userId: user.id, role: user.role });

    return tokens;
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        bio: true,
        gender: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { posts: true, likes: true } },
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    return user;
  }
}

export const authService = new AuthService();
