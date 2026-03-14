import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

const Navbar = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b dark:border-gray-800 flex items-center justify-between px-6 transition-colors duration-200">
      {/* Left */}
      <div className="font-semibold text-lg dark:text-white">Dashboard</div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-white shadow-sm">
          U
        </div>
      </div>
    </header>
  );
};

export default Navbar;
