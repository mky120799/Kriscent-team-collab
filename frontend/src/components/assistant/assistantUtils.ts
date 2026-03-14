import type { TaskStatus } from "@/store/services/task.api";

export const parseCommand = (
  input: string
): {
  action: "create" | "update" | null;
  title?: string;
  status?: TaskStatus;
} => {
  const lower = input.toLowerCase().trim();

  // Create commands: "Create task X", "Add task X"
  if (lower.startsWith("create task") || lower.startsWith("add task")) {
    const title = input.replace(/^(create task|add task)\s+/i, "").trim();
    return { action: "create", title, status: "todo" };
  }

  // Move commands: "Move task X to Y", "Set task X to Y", "Update task X to Y"
  if (lower.startsWith("move task") || lower.startsWith("set task") || lower.startsWith("update task")) {
    const match = input.match(/(?:move|set|update) task (.+) to (.+)/i);
    if (match) {
      const title = match[1].trim();
      const statusRaw = match[2].trim().toLowerCase();
      
      const statusMap: Record<string, TaskStatus> = {
        todo: "todo",
        "to do": "todo",
        "in progress": "in-progress",
        "doing": "in-progress",
        done: "done",
        finished: "done",
        completed: "done"
      };
      
      return { action: "update", title, status: statusMap[statusRaw] };
    }
  }

  return { action: null };
};
