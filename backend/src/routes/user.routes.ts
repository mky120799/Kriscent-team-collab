import { Router } from "express";
import { createUser, getUsers } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getUsers);
router.post("/", createUser);

export default router;
