import { Router } from "express";
import User from "../models/User.model.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import mongoose from "mongoose";
const router = Router();
// GET /api/teams/:teamId/members
router.get("/:teamId/members", authenticate, async (req, res) => {
    try {
        const teamId = req.params.teamId;
        if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
            return res.status(400).json({ message: "Invalid teamId" });
        }
        const members = await User.find({ teamId: new mongoose.Types.ObjectId(teamId) }).select("name email role");
        res.json(members);
    }
    catch (err) {
        console.error("Fetch members error:", err);
        res.status(500).json({ message: "Failed to fetch team members" });
    }
});
export default router;
//# sourceMappingURL=team.routes.js.map