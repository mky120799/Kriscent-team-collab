const Navbar = () => {
  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6">
      {/* Left */}
      <div className="font-semibold text-lg">Dashboard</div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button className="text-sm text-gray-600 hover:text-black">Dark</button>

        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
          U
        </div>
      </div>
    </header>
  );
};

export default Navbar;
