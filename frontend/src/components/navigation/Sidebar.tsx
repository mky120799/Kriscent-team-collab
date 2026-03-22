import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { logoutThunk } from "@/store/slices/auth.slice";
import { LogOut } from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Projects", path: "/projects" },
  { label: "Tasks", path: "/tasks" },
  { label: "Team", path: "/team" },
  { label: "Chat", path: "/chat" },
  { label: "Settings", path: "/settings" },
];

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate("/login");
  };

  return (
    <aside className="hidden md:flex w-64 bg-gray-900 text-white flex-col h-screen sticky top-0">
      {/* Logo / App Name */}
      <div className="p-6 text-xl font-bold border-b border-gray-800">
        Kriscent
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) =>
              `block rounded-md px-4 py-2 text-sm transition ${
                isActive
                  ? "bg-gray-800 font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
