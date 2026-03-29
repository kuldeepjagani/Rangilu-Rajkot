import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  port: parseInt(getEnvVar("PORT", "5000"), 10),
  nodeEnv: getEnvVar("NODE_ENV", "development"),

  db: {
    host: getEnvVar("DB_HOST", "localhost"),
    port: parseInt(getEnvVar("DB_PORT", "5432"), 10),
    username: getEnvVar("DB_USERNAME", "postgres"),
    password: getEnvVar("DB_PASSWORD"),
    name: getEnvVar("DB_NAME", "rangilu_rajkot"),
    url: getEnvVar("DATABASE_URL"),
  },

  jwt: {
    accessSecret: getEnvVar("JWT_ACCESS_SECRET"),
    refreshSecret: getEnvVar("JWT_REFRESH_SECRET"),
    accessExpiry: getEnvVar("JWT_ACCESS_EXPIRY", "15m"),
    refreshExpiry: getEnvVar("JWT_REFRESH_EXPIRY", "7d"),
  },

  upload: {
    dir: getEnvVar("UPLOAD_DIR", "uploads"),
    maxFileSize: parseInt(getEnvVar("MAX_FILE_SIZE", "5242880"), 10),
    maxFiles: parseInt(getEnvVar("MAX_FILES", "4"), 10),
  },

  aws: {
    bucketName: getEnvVar("AWS_BUCKET_NAME"),
    region: getEnvVar("AWS_REGION", "ap-south-1"),
    accessKeyId: getEnvVar("AWS_ACCESS_KEY_ID"),
    secretAccessKey: getEnvVar("AWS_SECRET_ACCESS_KEY"),
  },

  cors: {
    origin: getEnvVar("CORS_ORIGIN", "http://localhost:3000"),
  },

  isDev: getEnvVar("NODE_ENV", "development") === "development",
  isProd: getEnvVar("NODE_ENV", "development") === "production",
} as const;
