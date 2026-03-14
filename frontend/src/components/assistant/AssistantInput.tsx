import { useState } from "react";
import {
  useCreateTaskMutation,
  useGetTasksByProjectQuery,
  useUpdateTaskStatusMutation,
  useParseAssistantCommandMutation,
} from "@/store/services/task.api";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

type Props = {
  projectId: string;
};

const AssistantInput = ({ projectId }: Props) => {
  const [text, setText] = useState("");
  const auth = useAuth();
  const user =
    auth && typeof auth === "object" && "user" in auth
      ? (auth as { user?: { role?: string } }).user
      : undefined;
  const role = user?.role;
  const [createTask] = useCreateTaskMutation();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [parseCommand, { isLoading }] = useParseAssistantCommandMutation();
  const { data: tasks = [] } = useGetTasksByProjectQuery(projectId);

  if (role === "MEMBER") return null; // Only Admin/Manager

  const handleSend = async () => {
    if (!text.trim() || isLoading) return;

    try {
      const command = await parseCommand({ prompt: text }).unwrap();

      if (command.action === "create" && command.title) {
        await createTask({
          title: command.title,
          status: command.status ?? "todo",
          projectId,
        });
      }

      if (command.action === "update" && command.title && command.status) {
        const task = tasks.find(
          (t) => t.title.toLowerCase() === command.title?.toLowerCase(),
        );
        if (task) {
          await updateTaskStatus({ taskId: task._id, status: command.status });
        }
      }

      setText("");
    } catch (err) {
      console.error("Failed to parse prompt:", err);
    }
  };

  return (
    <div className="flex gap-2 p-3 border-t bg-gray-50 rounded">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='Type commands like "Create task Design DB" or "Move task API to In Progress"'
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend();
        }}
        disabled={isLoading}
        className="flex-1 border rounded px-3 py-2 disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={isLoading || !text.trim()}
        className="px-4 py-2 bg-primary text-white rounded flex items-center justify-center min-w-[80px]"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send"}
      </button>
    </div>
  );
};

export default AssistantInput;
