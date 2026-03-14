import { Router } from "express";
import User from "../models/User.model.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import mongoose from "mongoose";

const router = Router();

// GET /api/teams/:teamId/members
router.get("/:teamId/members", authenticate, async (req, res) => {
  try {
    const teamId = req.params.teamId as string;
    if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: "Invalid teamId" });
    }
    const members = await User.find({ teamId: new mongoose.Types.ObjectId(teamId) }).select("name email role");
    res.json(members);
  } catch (err) {
    console.error("Fetch members error:", err);
    res.status(500).json({ message: "Failed to fetch team members" });
  }
});

// POST /api/teams/:teamId/members
router.post("/:teamId/members", authenticate, async (req, res) => {
  try {
    const teamId = req.params.teamId as string;
    const userId = req.body.userId as string;
    const role = req.body.role as string;

    if (!teamId || !userId || !mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(userId)) {
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
