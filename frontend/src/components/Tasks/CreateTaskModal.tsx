import { useState } from "react";
import { useCreateTaskMutation } from "@/store/services/task.api";

type Props = {
  projectId: string;
  onClose: () => void;
};

const CreateTaskModal = ({ projectId, onClose }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [createTask, { isLoading }] = useCreateTaskMutation();

  const handleSubmit = async () => {
    if (!title.trim()) return;

    await createTask({
      title,
      description,
      projectId,
      status: "todo",
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-background rounded p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Create Task</h2>

        <input
          className="w-full border p-2 rounded mb-3"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full border p-2 rounded mb-4"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
