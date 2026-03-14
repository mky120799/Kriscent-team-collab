import { Router } from "express";
import { login } from "../controllers/auth.controller.js";

const router = Router();

// Login endpoint - verifies Firebase token and returns user data
router.post("/login", login);

export default router;
