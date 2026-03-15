import { Router } from "express";
import { login, getMe } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Login endpoint - verifies Firebase token and returns user data
router.post("/login", login);

// Get current user info for rehydration
router.get("/me", authenticate, getMe);

export default router;
