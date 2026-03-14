import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import KanbanColumn from "./KanbanColumn";
import {
  useGetTasksByProjectQuery,
  useUpdateTaskStatusMutation,
} from "@/store/services/task.api";

type Props = {
  projectId: string;
};

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

    try {
      await updateTaskStatus({
        taskId: draggableId,
        status: destination.droppableId as "todo" | "in-progress" | "done",
      }).unwrap();
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 h-full overflow-x-auto min-h-[500px]">
          <KanbanColumn title="Todo" columnId="todo" tasks={columns.todo} />
          <KanbanColumn
            title="In Progress"
            columnId="in-progress"
            tasks={columns["in-progress"]}
          />
          <KanbanColumn title="Done" columnId="done" tasks={columns.done} />
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
