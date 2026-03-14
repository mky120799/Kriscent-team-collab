import type { Response, NextFunction } from "express";
import { logActivity } from "../utils/activityLogger.js";
import Task, { type ITask } from "../models/Task.model.js";
import { type AuthRequest } from "../middlewares/auth.middleware.js";
import { getIO } from "../config/socket.js";

interface TaskPayload {
  title: string;
  description?: string;
  status?: "todo" | "in-progress" | "done";
  projectId: string;
  assignedTo?: string;
  teamId?: string;
}

export const getTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.query;

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
    const payload: TaskPayload = req.body;

    if (!payload.projectId) {
      return res.status(400).json({ message: "ProjectId is required" });
    }

    // Assign teamId from user if not provided
    if (req.user && !payload.teamId && req.user.teamId) {
      payload.teamId = req.user.teamId?.toString() ?? payload.teamId;
    }

    const task = await Task.create(payload);

    // Log activity AFTER task creation
    if (req.user) {
      await logActivity({
        action: "TASK_CREATED",
        entity: "TASK",
        entityId: task._id,
        performedBy: req.user._id,
        teamId: payload.teamId || req.user.teamId?.toString(),
        metadata: { title: task.title },
      });
    }

    // 🔥 Real-time emit
    const io = getIO();
    const teamId = payload.teamId || req.user?.teamId?.toString();
    if (teamId) {
      io.to(teamId).emit("task-created", task);
    }

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const taskId = req.params.id;
    const { status, assignedTo } = req.body as Partial<TaskPayload>;

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { status, assignedTo },
      { new: true }
    ).populate("assignedTo", "name email role");

    if (!updatedTask) {
      return res.status(404).json({ message: "Task find failed" });
    }

    // 🔥 Real-time emit to the specific team room
    const io = getIO();
    const teamId = updatedTask.teamId?.toString() || req.user?.teamId?.toString();
    if (teamId) {
      io.to(teamId).emit("task-updated", updatedTask);
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
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

    // 🔥 Real-time emit
    const io = getIO();
    const teamId = req.user?.teamId?.toString();
    if (teamId) {
      io.to(teamId).emit("task-deleted", { taskId: task._id });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
};
