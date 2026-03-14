import { useAppSelector } from "@/store/hooks";

export const useAuth = () => {
  const { user, loading } = useAppSelector((state) => state.auth);

  return { user, loading };
};
