import type { Response, NextFunction } from "express";
import Project from "../models/Project.model.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { getIO } from "../config/socket.js";
import { logActivity } from "../utils/activityLogger.js";

import Team from "../models/Team.model.js";

export const getProjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;
    let query = {};

    if (req.user?.role === "ADMIN") {
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      // Admins see projects from all teams they own
      const teams = await Team.find({ adminId: userId });
      const teamIds = teams.map((t) => t._id);
      query = { teamId: { $in: teamIds } };
    } else {
      // Members see projects from their specific team
      query = { teamId: req.user?.teamId };
    }

    const projects = await Project.find(query);
    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};

export const createProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, description, teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({ message: "teamId is required" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim(),
      teamId,
    });

    // Log activity
    if (req.user) {
      await logActivity({
        action: "PROJECT_CREATED",
        entity: "PROJECT",
        entityId: project._id,
        performedBy: req.user._id,
        teamId: teamId.toString(),
        metadata: { name: project.name },
      });
    }

    // Real-time emit
    const io = getIO();
    io.to(teamId.toString()).emit("project-created", project);

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, description } = req.body;
    const updateData: { name?: string; description?: string } = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();

    const project = await Project.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Log activity
    if (req.user) {
      await logActivity({
        action: "PROJECT_UPDATED",
        entity: "PROJECT",
        entityId: project._id,
        performedBy: req.user._id,
        teamId: project.teamId.toString(),
        metadata: { name: project.name },
      });
    }

    // Real-time emit
    const io = getIO();
    io.to(project.teamId.toString()).emit("project-updated", project);

    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Log activity
    if (req.user) {
      await logActivity({
        action: "PROJECT_DELETED",
        entity: "PROJECT",
        entityId: project._id,
        performedBy: req.user._id,
        teamId: project.teamId.toString(),
        metadata: { name: project.name },
      });
    }

    // Real-time emit
    const io = getIO();
    io.to(project.teamId.toString()).emit("project-deleted", {
      projectId: project._id,
    });

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    next(error);
  }
};
