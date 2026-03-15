import admin from "../config/firebaseAdmin.js";
import User from "../models/User.model.js";

import type { Request, Response } from "express";

import type { AuthRequest } from "../middlewares/auth.middleware.js";

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get user info" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body; // Token sent from frontend

    if (!idToken) return res.status(400).json({ message: "No token provided" });

    // ✅ Verify token with Firebase Admin
    const decoded = await admin.auth().verifyIdToken(idToken);

    // ✅ Find user in database
    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) return res.status(401).json({ message: "User not found" });

    // ✅ Create session
    console.log(
      "SESSION BEFORE:",
      req.session,
      "this is the session id",
      req.session.id,
    );

    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      teamId: user.teamId?.toString() || null,
    };

    req.session.save((err) => {
      if (err) {
        console.error("Session save error", err);
        return res.status(500).json({ message: "Session save failed" });
      }
    });

    console.log("SESSION AFTER:", req.session);

    // ✅ Send back user info
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};
