import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import admin from "./firebaseAdmin.js";
import User from "../models/User.model.js";
import Message from "../models/Message.model.js";

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
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
    if (user.teamId) {
      socket.join(user.teamId.toString());
    }
    // ✅ Join specific team room (for dynamic switching)
    socket.on("join-room", (teamId: string) => {
      if (!teamId) return;
      const targetRoom = teamId.toString();
      // Basic validation: user should be admin or member of team
      const userTeamId = user.teamId?.toString();
      if (user.role === "ADMIN" || userTeamId === targetRoom) {
        socket.join(targetRoom);
        console.log(`👥 User ${user.email} joined room: ${targetRoom}`);
      }
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
