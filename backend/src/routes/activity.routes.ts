import express from "express";
import { ActivityLog } from "../models/ActivityLog.model.js";
import { authorizeRoles } from "../middlewares/rbac.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "MANAGER"),
  async (req, res) => {
    const user = (req as any).user;
    const queriedTeamId = req.query.teamId as string;
    const targetTeamId = queriedTeamId || user?.teamId;

    if (!user || !targetTeamId) {
      return res.status(400).json({ error: "Missing user or teamId" });
    }

    const logs = await ActivityLog.find({
      teamId: targetTeamId,
    })
      .populate("performedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(logs);
  },
);

export default router;
