import useAuthContext from "../auth/AuthContext";

export const useAuth = () => {
  const user = useAuthContext();

  if (!user) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return user;
};
