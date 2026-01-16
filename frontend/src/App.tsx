import { BrowserRouter, Routes, Route } from "react-router-dom";

/* Layouts */
import AuthLayout from "./layouts/AuthLayout";
import AppLayout from "./layouts/AppLayout";

/* Auth & Protection */
import ProtectedRoute from "@/auth/ProtectedRoute";

/* Pages */
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Activity from "./pages/Activity";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= AUTH ROUTES ================= */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* ================= APP ROUTES ================= */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />

          {/* Projects – Admin & Manager only */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                <Projects />
              </ProtectedRoute>
            }
          />

          {/* Tasks – All roles */}
          <Route
            path="/tasks"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "MEMBER"]}>
                <Tasks />
              </ProtectedRoute>
            }
          />

          {/* Team – Admin & Manager */}
          <Route
            path="/team"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                <Team />
              </ProtectedRoute>
            }
          />

          {/* Chat – All roles */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "MEMBER"]}>
                <Chat />
              </ProtectedRoute>
            }
          />

          {/* Settings – Admin only */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>
        {/* Activity */}
        <Route
          path="/activity"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
              <Activity />
            </ProtectedRoute>
          }
        />

        {/* ================= FALLBACK ================= */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
