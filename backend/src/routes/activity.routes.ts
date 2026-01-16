import express from "express";
import { ActivityLog } from "../models/ActivityLog.model.js";
import { authorizeRoles } from "../middlewares/rbac.middleware.js";

const router = express.Router();

router.get("/", authorizeRoles("ADMIN", "MANAGER"), async (req, res) => {
  
  const user = (req as any).user;
  if (!user || !user.teamId) {
    return res.status(400).json({ error: "Missing user or teamId" });
  }

  const logs = await ActivityLog.find({
    teamId: user.teamId,
  })
    .populate("performedBy", "name email")
    .sort({ createdAt: -1 });

  res.json(logs);
});

export default router;
