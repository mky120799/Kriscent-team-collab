import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import KanbanColumn from "./KanbanColumn";
import CreateTaskButton from "@/components/tasks/CreateTaskButton";

import {
  useGetTasksByProjectQuery,
  useUpdateTaskStatusMutation,
} from "@/store/services/TaskApi";

type Props = {
  projectId: string;
};

// TEMP role (replace with auth later)
const userRole = "MANAGER";

const KanbanBoard = ({ projectId }: Props) => {
  const { data: tasks = [] } = useGetTasksByProjectQuery(projectId);
  const [updateTaskStatus] = useUpdateTaskStatusMutation();

  const columns = {
    todo: tasks.filter((t) => t.status === "todo"),
    "in-progress": tasks.filter((t) => t.status === "in-progress"),
    done: tasks.filter((t) => t.status === "done"),
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    await updateTaskStatus({
      taskId: draggableId,
      status: destination.droppableId as any,
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 h-full overflow-x-auto">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">Kanban Board</h2>
          <CreateTaskButton projectId={projectId} role={userRole} />
        </div>
        <KanbanColumn title="Todo" columnId="todo" tasks={columns.todo} />
        <KanbanColumn
          title="In Progress"
          columnId="in-progress"
          tasks={columns["in-progress"]}
        />
        <KanbanColumn title="Done" columnId="done" tasks={columns.done} />
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
