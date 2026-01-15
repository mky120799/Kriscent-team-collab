import type { Response, NextFunction } from "express";
import  Task from "../models/Task.model.js";
import { type AuthRequest } from "../middlewares/auth.middleware.js";
import { getIO } from "../config/socket.js";

export const getTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.query;

    // Ensure projectId is a string and exists before querying
    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({ message: "Invalid or missing projectId" });
    }

    const tasks = await Task.find({ projectId }).populate(
      "assignedTo",
      "name email role"
    );

    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: any, res: any) => {
  try {
    const taskId = req.params.id;
    const { status, assignedTo } = req.body;

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { status, assignedTo },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 🔥 REAL-TIME EMIT
    const io = getIO();
    io.to(updatedTask.projectId.toString()).emit("task-updated", updatedTask);

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Failed to update task" });
  }
};

export const deleteTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
};
