import { Navigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import type { JSX } from "react";

interface Props {
  allowedRoles: Array<"ADMIN" | "MANAGER" | "MEMBER">;
  children: JSX.Element;
}

const RoleGuard = ({ allowedRoles, children }: Props) => {
  const { user } = useAppSelector((state) => state.auth);

  if (!user || !user.role) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleGuard;
