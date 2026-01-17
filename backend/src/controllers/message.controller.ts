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
      .sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: any, res: any) => {
  try {
    const { content } = req.body;
    const { teamId } = req.user;

    const message = await Message.create({
      content,
      senderId: req.user._id,
      teamId,
    });

    // emit to team room
    const io = getIO();
    io.to(teamId.toString()).emit("new-message", message);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Failed to send message" });
  }
};
