import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import messageRoutes from "./routes/message.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import teamRoutes from "./routes/team.routes.js";
import assistantRoutes from "./routes/assistant.routes.js";

import { errorHandler } from "./middlewares/error.middleware.js";
import { sessionMiddleware } from "./config/session.js";

const app = express();
app.set("trust proxy", 1);

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

// ✅ SINGLE SOURCE OF TRUTH FOR SESSION
app.use(sessionMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/assistant", assistantRoutes);

app.use(errorHandler);

export default app;
