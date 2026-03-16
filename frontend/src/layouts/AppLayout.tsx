import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import Navbar from "../components/navigation/Navbar";
import { connectSocket } from "@/socket";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { rehydrateUser, clearUser } from "@/store/slices/auth.slice";
import { auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";

const AppLayout = () => {
  const dispatch = useAppDispatch();
  const { isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    let isRehydrating = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Avoid infinite loops or redundant calls if already processing
      if (isRehydrating) return;

      if (firebaseUser) {
        console.log("🔥 Firebase User detected. Rehydrating session...");
        isRehydrating = true;
        try {
          await dispatch(rehydrateUser()).unwrap();
          connectSocket();
        } catch (err) {
          console.error("❌ Rehydration failed:", err);
        } finally {
          isRehydrating = false;
        }
      } else {
        console.log("👻 No Firebase User. Marking as unauthenticated.");
        dispatch(clearUser()); // This now sets isInitialized to true
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground animate-pulse">
            Initializing your session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Navbar />

        <main className="flex-1 bg-gray-100 dark:bg-gray-800/50 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
