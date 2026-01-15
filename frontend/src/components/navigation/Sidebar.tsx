import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Projects", path: "/projects" },
  { label: "Tasks", path: "/tasks" },
  { label: "Team", path: "/team" },
  { label: "Chat", path: "/chat" },
  { label: "Settings", path: "/settings" },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
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
    </aside>
  );
};

export default Sidebar;
