import { Router } from "express";
import { parseCommand } from "../controllers/assistant.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/parse", authenticate, parseCommand);

export default router;
