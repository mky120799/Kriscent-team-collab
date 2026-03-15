import { Router } from "express";
import { getMessages, sendMessage } from "../controllers/message.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getMessages);
router.post("/", authenticate, sendMessage);

export default router;
