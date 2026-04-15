import jwt from "jsonwebtoken";
import { config } from "../config";

interface TokenPayload {
  userId: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiry as any });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiry as any });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
}

export function generateTokenPair(payload: TokenPayload) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}
