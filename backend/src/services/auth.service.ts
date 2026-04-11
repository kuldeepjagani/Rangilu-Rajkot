import bcrypt from "bcryptjs";
import { User } from "../models";
import { Post } from "../models";
import { Like } from "../models";
import { ApiError } from "../utils/apiError";
import { generateTokenPair, verifyRefreshToken } from "../utils/jwt";

const SALT_ROUNDS = 12;

export class AuthService {
  async register(data: { username: string; email: string; password: string; displayName: string; gender?: string }) {
    const existingUser = await User.findOne({
      $or: [{ email: data.email }, { username: data.username }],
    });

    if (existingUser) {
      const field = existingUser.email === data.email ? "Email" : "Username";
      throw ApiError.conflict(`${field} already exists`);
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await User.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      displayName: data.displayName,
      ...(data.gender && { gender: data.gender }),
    });

    const userObj = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      gender: user.gender || null,
      role: user.role,
      createdAt: user.createdAt,
    };

    const tokens = generateTokenPair({ userId: user._id.toString(), role: user.role });

    return { user: userObj, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email });

    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const tokens = generateTokenPair({ userId: user._id.toString(), role: user.role });

    const userObj = user.toJSON();
    delete (userObj as any).password;

    return { user: userObj, ...tokens };
  }

  async refreshToken(refreshToken: string) {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId).select("_id role");

    if (!user) {
      throw ApiError.unauthorized("User no longer exists");
    }

    const tokens = generateTokenPair({ userId: user._id.toString(), role: user.role });

    return tokens;
  }

  async getMe(userId: string) {
    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const [postsCount, likesCount] = await Promise.all([
      Post.countDocuments({ authorId: userId }),
      Like.countDocuments({ userId }),
    ]);

    const userObj = user.toJSON();

    return {
      ...userObj,
      _count: { posts: postsCount, likes: likesCount },
    };
  }
}

export const authService = new AuthService();
