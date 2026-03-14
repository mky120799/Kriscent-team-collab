import mongoose from "mongoose";
import User from "../models/User.model.js";
import Team from "../models/Team.model.js";
export const createUser = async (req, res, next) => {
    try {
        const { firebaseUid, name, email } = req.body;
        // 1️⃣ Check if this Firebase user already exists
        const existingUser = await User.findOne({ firebaseUid });
        if (existingUser) {
            return res.status(200).json(existingUser);
        }
        // 2️⃣ Check if this is the first user in the system
        const userCount = await User.countDocuments();
        let role = "MEMBER";
        let teamId = null;
        // 3️⃣ First user → ADMIN + auto-create team
        if (userCount === 0) {
            role = "ADMIN";
            const team = await Team.create({
                name: "Default Team",
                description: "Auto-created team for first admin",
            });
            teamId = team._id;
        }
        // 4️⃣ Create user
        const userData = {
            firebaseUid,
            name,
            email,
            role,
        };
        if (teamId) {
            userData.teamId = teamId;
        }
        const user = await User.create(userData);
        // 5️⃣ Return created user
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            teamId: user.teamId ? user.teamId.toString() : null,
            firebaseUid: user.firebaseUid,
        });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=user.controller.js.map