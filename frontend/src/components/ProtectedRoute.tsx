import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";

const ProtectedRoute = ({
  allowedRoles,
  children,
}: {
  allowedRoles: Array<"ADMIN" | "MANAGER" | "MEMBER">;
  children: JSX.Element;
}) => {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
