import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import admin from "./firebaseAdmin.js";
import User from "../models/User.model.js";
import Message from "../models/Message.model.js";

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // frontend URL
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // 🔐 Socket Auth Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));

      const decoded = await admin.auth().verifyIdToken(token);
      const user = await User.findOne({ firebaseUid: decoded.uid });

      if (!user) return next(new Error("User not found"));

      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    console.log("🔌 Socket connected:", user.email);

    // ✅ Auto join team room
    socket.join(user.teamId.toString());
    console.log(`👥 Joined team room: ${user.teamId}`);

    /**
     * 💬 SEND MESSAGE
     */
    socket.on("send-message", async (content: string) => {
      if (!content?.trim()) return;

      const message = await Message.create({
        content,
        senderId: user._id,
        teamId: user.teamId,
      });

      const populatedMessage = await message.populate("senderId", "name");

      // 📡 Broadcast to entire team
      io.to(user.teamId.toString()).emit("new-message", populatedMessage);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", user.email);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
