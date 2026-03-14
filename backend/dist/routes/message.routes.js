import { Router } from "express";
import { getMessages, sendMessage } from "../controllers/message.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { sessionAuth } from "../middlewares/sessionAuth.middleware.js";
const router = Router();
// Get team chat messages
router.get("/", authenticate, getMessages);
// Send message
router.post("/", authenticate, sendMessage);
export default router;
//# sourceMappingURL=message.routes.js.map