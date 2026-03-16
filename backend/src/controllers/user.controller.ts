import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import User from "../models/User.model.js";
import Team from "../models/Team.model.js";
import Project from "../models/Project.model.js";

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { projectId, search } = req.query;

    let query: any = {};

    if (projectId && typeof projectId === "string") {
      const project = await Project.findById(projectId);
      if (project) {
        const team = await Team.findById(project.teamId);
        if (team) {
          query.$or = [{ teamId: project.teamId }, { _id: team.adminId }];
        } else {
          query.teamId = project.teamId;
        }
      } else {
        return res.status(404).json({ message: "Project not found" });
      }
    }

    if (search && typeof search === "string") {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).select("name email role teamId");
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { firebaseUid, name, email } = req.body;

    const existingUser = await User.findOne({ firebaseUid });
    if (existingUser) {
      return res.status(200).json(existingUser);
    }

    const userCount = await User.countDocuments();
    let role: "ADMIN" | "MANAGER" | "MEMBER" = "MEMBER";

    // Create user FIRST
    const user = new User({
      firebaseUid,
      name,
      email,
      role: userCount === 0 ? "ADMIN" : "MEMBER",
    });

    if (userCount === 0) {
      const team = await Team.create({
        name: "Default Team",
        description: "Auto-created team for first admin",
        adminId: user._id,
      });
      user.teamId = team._id as mongoose.Types.ObjectId;
    }

    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId ? user.teamId.toString() : null,
      firebaseUid: user.firebaseUid,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (
  req: any, // Using any for AuthRequest compatibility in this context
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!["ADMIN", "MANAGER", "MEMBER"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update role
    user.role = role as "ADMIN" | "MANAGER" | "MEMBER";
    await user.save();

    res.json({ message: "User role updated successfully", user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: any, // AuthRequest
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name;
    await user.save();

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    next(error);
  }
};
