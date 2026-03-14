import type { Response, NextFunction } from "express";
import Message from "../models/Message.model.js";
import { type AuthRequest } from "../middlewares/auth.middleware.js";
import { getIO } from "../config/socket.js";

export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const teamId = req.user?.teamId;

    if (!teamId) {
      return res.status(400).json({ message: "teamId is required" });
    }

    const messages = await Message.find({ teamId })
      .populate("senderId", "name email role")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { content } = req.body;
    const teamId = req.user?.teamId;

    if (!teamId) {
      return res.status(400).json({ message: "teamId is required" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const message = await Message.create({
      content: content.trim(),
      senderId: req.user._id,
      teamId,
    });

    // Populate senderId before emitting
    const populatedMessage = await message.populate(
      "senderId",
      "name email role"
    );

    // emit to team room
    const io = getIO();
    io.to(teamId.toString()).emit("new-message", populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    next(error);
  }
};
