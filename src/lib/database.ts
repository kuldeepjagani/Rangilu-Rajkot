import mongoose from "mongoose";
import { config } from "../config";

export const connectDB = async () => {
  try {
    await mongoose.connect(config.db.url);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
};
