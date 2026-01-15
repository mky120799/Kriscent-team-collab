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

const router = Router();

router.get("/", authenticate, getProjects);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "MANAGER"),
  createProject
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "MANAGER"),
  updateProject
);

router.delete("/:id", authenticate, authorizeRoles("ADMIN"), deleteProject);
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "MANAGER"),
  validate(createProjectSchema),
  createProject
);

export default router;
