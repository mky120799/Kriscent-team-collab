import { Router } from "express";
import {
  createUser,
  getUsers,
  updateUserRole,
  updateProfile,
} from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/rbac.middleware.js";

const router = Router();

router.get("/", authenticate, getUsers);
router.post("/", createUser);
router.patch("/profile", authenticate, updateProfile);
router.patch(
  "/:id/role",
  authenticate,
  authorizeRoles("ADMIN"),
  updateUserRole,
);

export default router;
