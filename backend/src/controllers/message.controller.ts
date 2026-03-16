import type { Response, NextFunction } from "express";
import Message from "../models/Message.model.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { getIO } from "../config/socket.js";

export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { teamId } = req.query;

    if (!teamId) {
      return res.status(400).json({ message: "teamId is required" });
    }

    // Basic permission check: User should be member of team or be admin
    const userTeamId = req.user?.teamId?.toString();
    const isAdmin = req.user?.role === "ADMIN";

    if (!isAdmin && userTeamId !== teamId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You are not a member of this team" });
    }

    const messages = await Message.find({ teamId })
      .populate("senderId", "name")
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { content, teamId } = req.body;
    const senderId = req.user?._id;

    console.log(
      `[MESSAGE PROBE] Sending message from: ${req.user?.name} (${senderId}), Content: "${content.substring(0, 20)}..."`,
    );

    if (!senderId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!content || !teamId) {
      return res
        .status(400)
        .json({ message: "Content and teamId are required" });
    }

    const message = await Message.create({
      content,
      senderId,
      teamId,
    });

    const populatedMessage = await message.populate("senderId", "name");

    // Defensive: Force correct sender info if population is flaky
    const responseData = {
      ...populatedMessage.toObject(),
      senderId: {
        _id: senderId.toString(),
        name: req.user?.name || "Unknown User",
      },
    };

    // 📡 Real-time broadcast
    try {
      const io = getIO();
      console.log(
        `📤 [DEFENSIVE] Broadcasting message from ${responseData.senderId.name} to room: ${teamId.toString()}`,
      );
      io.to(teamId.toString()).emit("new-message", responseData);
    } catch (err) {
      console.error("Socket broadcast failed:", err);
    }

    res.status(201).json(responseData);
  } catch (error) {
    next(error);
  }
};
