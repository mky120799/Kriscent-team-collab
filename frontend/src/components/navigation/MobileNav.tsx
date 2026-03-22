import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { logoutThunk } from "@/store/slices/auth.slice";
import { LogOut, X } from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Projects", path: "/projects" },
  { label: "Tasks", path: "/tasks" },
  { label: "Team", path: "/team" },
  { label: "Chat", path: "/chat" },
  { label: "Settings", path: "/settings" },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const MobileNav = ({ isOpen, onClose }: Props) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    onClose();
    navigate("/login");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-gray-900 shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out">
        <div className="p-6 flex items-center justify-between border-b border-gray-800">
          <div className="text-xl font-bold text-white">Kriscent</div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              end
              className={({ isActive }) =>
                `block rounded-md px-4 py-3 text-base transition ${
                  isActive
                    ? "bg-gray-800 text-white font-medium"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-base text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </div>
  );
};

export default MobileNav;
