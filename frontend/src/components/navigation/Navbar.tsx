import { useState, useEffect } from "react";
import { Moon, Sun, Menu } from "lucide-react";

type Props = {
  onOpenMobileMenu: () => void;
};

const Navbar = ({ onOpenMobileMenu }: Props) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b dark:border-gray-800 flex items-center justify-between px-4 md:px-6 transition-colors duration-200 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 md:hidden rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="font-semibold text-lg dark:text-white hidden sm:block">
          Dashboard
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-white shadow-sm ring-2 ring-background ring-offset-2 ring-offset-muted-foreground/10">
          U
        </div>
      </div>
    </header>
  );
};

export default Navbar;
