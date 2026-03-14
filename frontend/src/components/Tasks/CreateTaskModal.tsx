import { useState } from "react";
import { useCreateTaskMutation } from "@/store/services/task.api";
import AssignUserSelect from "./AssignUserSelect";

type Props = {
  projectId: string;
  onClose: () => void;
};

const CreateTaskModal = ({ projectId, onClose }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [createTask, { isLoading }] = useCreateTaskMutation();

  const handleSubmit = async () => {
    if (!title.trim()) return;

    try {
      await createTask({
        title,
        description,
        projectId,
        assignedTo: assignedTo || undefined,
        status: "todo",
      }).unwrap();
      onClose();
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl p-6 w-full max-w-md border">
        <h2 className="text-xl font-bold mb-4">Create New Task</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <input
              className="w-full border rounded-md p-2 bg-background focus:ring-2 focus:ring-primary outline-none"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea
              className="w-full border rounded-md p-2 bg-background focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
              placeholder="Optional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Assignee</label>
            <AssignUserSelect projectId={projectId} onSelect={setAssignedTo} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
