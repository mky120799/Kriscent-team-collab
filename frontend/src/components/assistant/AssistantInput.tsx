import { useState } from "react";
import {
  useCreateTaskMutation,
  useGetTasksByProjectQuery,
  useUpdateTaskStatusMutation,
} from "@/store/services/task.api";
import { parseCommand } from "./assistantUtils";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  projectId: string;
};

const AssistantInput = ({ projectId }: Props) => {
  const [text, setText] = useState("");
  const { role } = useAuth();
  const [createTask] = useCreateTaskMutation();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const { data: tasks = [] } = useGetTasksByProjectQuery(projectId);

  if (role === "MEMBER") return null; // Only Admin/Manager

  const handleSend = async () => {
    if (!text.trim()) return;

    const command = parseCommand(text);

    if (command.action === "create" && command.title) {
      await createTask({
        title: command.title,
        status: command.status ?? "todo",
        projectId,
      });
    }

    if (command.action === "update" && command.title && command.status) {
      const task = tasks.find(
        (t) => t.title.toLowerCase() === command.title?.toLowerCase()
      );
      if (task) {
        await updateTaskStatus({ taskId: task._id, status: command.status });
      }
    }

    setText("");
  };

  return (
    <div className="flex gap-2 p-3 border-t bg-gray-50 rounded">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='Type commands like "Create task Design DB" or "Move task API to In Progress"'
        className="flex-1 border rounded px-3 py-2"
      />
      <button
        onClick={handleSend}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Send
      </button>
    </div>
  );
};

export default AssistantInput;
