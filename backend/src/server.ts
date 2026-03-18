import "dotenv/config";

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./config/socket.js";

const PORT = process.env.PORT || 5555;

const startServer = async () => {
  try {
    console.log("🛠️ Starting server discovery...");
    console.log("📍 Environment Port:", process.env.PORT);
    console.log("📍 Default Port:", 5555);

    await connectDB();

    const server = http.createServer(app);
    initSocket(server);

    const ACT_PORT = Number(PORT);

    server.listen(ACT_PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://0.0.0.0:${ACT_PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server", error);
    process.exit(1);
  }
};

startServer();
