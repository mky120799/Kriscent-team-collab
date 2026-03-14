import User, {} from "../models/User.model.js";
import admin from "../config/firebaseAdmin.js";
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }
        const token = authHeader?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: Invalid token format" });
        }
        const decoded = await admin.auth().verifyIdToken(token);
        const user = await User.findOne({ firebaseUid: decoded.uid });
        if (!user) {
            return res.status(401).json({ message: "Unauthorized: User not found in database" });
        }
        req.user = user;
        next();
    }
    catch (err) {
        console.error("Auth Error:", err);
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};
//# sourceMappingURL=auth.middleware.js.map