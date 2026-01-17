import { createContext } from "react";

export type Role = "ADMIN" | "MANAGER" | "MEMBER";

type AuthUser = {
  id: string;
  name: string;
  role: Role;
};

const AuthContext = createContext<AuthUser | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // TEMP user (replace with Firebase later)
  const user: AuthUser = {
    id: "u1",
    name: "Mithilesh",
    role: "MANAGER",
  };

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
