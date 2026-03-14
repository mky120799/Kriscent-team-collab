import { Router } from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/task.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/rbac.middleware.js";
import { sessionAuth } from "../middlewares/sessionAuth.middleware.js";

const router = Router();
// ✅ Routes
router.get("/", authenticate, getTasks);

router.post("/", authenticate, authorizeRoles("ADMIN", "MANAGER"), createTask);

router.put(
  "/:id",
  authenticate,
  // Members can update tasks (e.g. status change)
  authorizeRoles("ADMIN", "MANAGER", "MEMBER"),
  updateTask
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "MANAGER"),
  deleteTask
);

export default router;
