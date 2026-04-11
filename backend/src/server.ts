import app from "./app";
import { config } from "./config";
import { connectDB, disconnectDB } from "./lib/database";

async function startServer() {
  try {
    await connectDB();

    app.listen(config.port, () => {
      console.log(`🚀 RajkotLive API running on http://localhost:${config.port}`);
      console.log(`📦 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await disconnectDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnectDB();
  process.exit(0);
});

startServer();
