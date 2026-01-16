import { useState } from "react";
import CreateTaskModal from "./CreateTaskModal";

type Props = {
  projectId: string;
  role: "ADMIN" | "MANAGER" | "MEMBER";
};

const CreateTaskButton = ({ projectId, role }: Props) => {
  const [open, setOpen] = useState(false);

  if (role === "MEMBER") return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        + New Task
      </button>

      {open && (
        <CreateTaskModal projectId={projectId} onClose={() => setOpen(false)} />
      )}
    </>
  );
};

export default CreateTaskButton;
