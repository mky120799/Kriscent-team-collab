import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import type { Role } from "./AuthContext";

type Props = {
  allowedRoles: Role[];
  children: JSX.Element;
};

const ProtectedRoute = ({ allowedRoles, children }: Props) => {
  const user = useAuth();

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
