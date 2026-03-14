import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { createProjectSchema } from "../validations/project.validation.js";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/project.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/rbac.middleware.js";
import { sessionAuth } from "../middlewares/sessionAuth.middleware.js";

const router = Router();

// ✅ Routes
router.get("/", authenticate, getProjects);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "MANAGER"),
  validate(createProjectSchema),
  createProject
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "MANAGER"),
  updateProject
);

router.delete("/:id", authenticate, authorizeRoles("ADMIN"), deleteProject);

export default router;
