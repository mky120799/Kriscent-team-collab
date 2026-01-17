import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import type { ReactNode } from "react";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles?: Array<"ADMIN" | "MANAGER" | "MEMBER">;
};

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const user = useAppSelector((state) => state.auth.user);

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Logged in but role not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Allowed
  return <>{children}</>;
};

export default ProtectedRoute;
