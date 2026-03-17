type Props = {
  role: "ADMIN" | "MANAGER" | "MEMBER";
};

const RoleBadge = ({ role }: Props) => {
  let colorClass = "";

  switch (role) {
    case "ADMIN":
      colorClass = "bg-red-500 text-white";
      break;
    case "MANAGER":
      colorClass = "bg-blue-500 text-white";
      break;
    case "MEMBER":
      colorClass = "bg-green-500 text-white";
      break;
    default:
      colorClass = "bg-gray-200 text-gray-800";
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>
      {role}
    </span>
  );
};

export default RoleBadge;
