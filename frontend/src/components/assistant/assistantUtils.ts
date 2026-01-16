import type { TaskStatus } from "@/store/services/TaskApi";

export const parseCommand = (
  input: string
): {
  action: "create" | "update" | null;
  title?: string;
  status?: TaskStatus;
} => {
  const lower = input.toLowerCase();

  if (lower.startsWith("create task")) {
    // Example: "Create task Design Login Page"
    const title = input.replace(/^create task\s+/i, "").trim();
    return { action: "create", title, status: "todo" };
  }

  if (lower.startsWith("move task")) {
    // Example: "Move task DB schema to In Progress"
    const match = input.match(/move task (.+) to (.+)/i);
    if (match) {
      const title = match[1].trim();
      const statusRaw = match[2].trim().toLowerCase();
      const statusMap: Record<string, TaskStatus> = {
        todo: "todo",
        "in progress": "in-progress",
        done: "done",
      };
      return { action: "update", title, status: statusMap[statusRaw] };
    }
  }

  return { action: null };
};
