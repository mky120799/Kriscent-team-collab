import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import Navbar from "../components/navigation/Navbar";
import MobileNav from "../components/navigation/MobileNav";
import { connectSocket } from "@/socket";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { rehydrateUser, clearUser } from "@/store/slices/auth.slice";
import { auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";

const AppLayout = () => {
  const dispatch = useAppDispatch();
  const { isInitialized } = useAppSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close mobile menu on larger screens or route changes (handled by components but good to have)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar/Drawer Overlay */}
      <MobileNav 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      <div className="flex flex-1 flex-col transition-all duration-300 min-w-0">
        <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
