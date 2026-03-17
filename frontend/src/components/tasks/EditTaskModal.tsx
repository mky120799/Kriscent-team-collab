import { useState } from "react";
import { useUpdateTaskMutation, type Task } from "@/store/services/task.api";
import AssignUserSelect from "./AssignUserSelect";

type Props = {
  task: Task;
  onClose: () => void;
};

const EditTaskModal = ({ task, onClose }: Props) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [assignedTo, setAssignedTo] = useState(
    typeof task.assignedTo === "object" ? task.assignedTo._id : task.assignedTo || ""
  );

  const [updateTask, { isLoading }] = useUpdateTaskMutation();

  const handleSubmit = async () => {
    if (!title.trim()) return;

    try {
      await updateTask({
        taskId: task._id,
        payload: {
          title,
          description,
          assignedTo: assignedTo || undefined,
        },
      }).unwrap();
      onClose();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl p-6 w-full max-w-md border">
        <h2 className="text-xl font-bold mb-4">Edit Task</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <input
              className="w-full border rounded-md p-2 bg-background focus:ring-2 focus:ring-primary outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea
              className="w-full border rounded-md p-2 bg-background focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Assignee</label>
            <AssignUserSelect 
              projectId={task.projectId} 
              initialValue={assignedTo}
              onSelect={setAssignedTo} 
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTaskModal;
