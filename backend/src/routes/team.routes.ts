import { Router } from "express";
import User from "../models/User.model.js";
import {
  authenticate,
  type AuthRequest,
} from "../middlewares/auth.middleware.js";
import mongoose from "mongoose";
import Team from "../models/Team.model.js";

const router = Router();

// GET /api/teams
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?._id;
    let query = {};

    if (req.user?.role === "ADMIN") {
      // Admins see the teams they own
      query = { adminId: userId };
    } else {
      // Members see the team they belong to
      query = { _id: req.user?.teamId };
    }

    const teams = await Team.find(query);
    res.json(teams);
  } catch (err) {
    console.error("Fetch teams error:", err);
    res.status(500).json({ message: "Failed to fetch teams" });
  }
});

// POST /api/teams
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ message: "Only Admins can create teams" });
    }

    const { name, description } = req.body;
    if (!name)
      return res.status(400).json({ message: "Team name is required" });

    const team = await Team.create({
      name,
      description,
      adminId: req.user._id,
    });

    res.status(201).json(team);
  } catch (err) {
    console.error("Create team error:", err);
    res.status(500).json({ message: "Failed to create team" });
  }
});

// GET /api/teams/:teamId/members
router.get("/:teamId/members", authenticate, async (req: AuthRequest, res) => {
  try {
    const teamId = req.params.teamId as string;
    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: "Invalid teamId" });
    }
    const members = await User.find({
      teamId: new mongoose.Types.ObjectId(teamId),
    }).select("name email role");
    res.json(members);
  } catch (err) {
    console.error("Fetch members error:", err);
    res.status(500).json({ message: "Failed to fetch team members" });
  }
});

// POST /api/teams/:teamId/members
router.post("/:teamId/members", authenticate, async (req: AuthRequest, res) => {
  try {
    const teamId = req.params.teamId as string;
    const userId = req.body.userId as string;
    const role = req.body.role as string;

    if (
      !teamId ||
      !userId ||
      !mongoose.Types.ObjectId.isValid(teamId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid teamId or userId" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.teamId = new mongoose.Types.ObjectId(teamId);
    if (role && (role === "ADMIN" || role === "MANAGER" || role === "MEMBER")) {
      user.role = role;
    }
    await user.save();

    res.json({ message: "Member added successfully", user });
  } catch (err) {
    console.error("Add member error:", err);
    res.status(500).json({ message: "Failed to add team member" });
  }
});

export default router;
