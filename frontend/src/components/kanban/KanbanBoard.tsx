import { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import KanbanColumn from "./KanbanColumn";

export type Task = {
  id: string;
  title: string;
};

type BoardState = {
  todo: Task[];
  inProgress: Task[];
  done: Task[];
};

const KanbanBoard = () => {
  const [board, setBoard] = useState<BoardState>({
    todo: [
      { id: "1", title: "Design DB schema" },
      { id: "2", title: "Setup backend" },
    ],
    inProgress: [{ id: "3", title: "Kanban UI" }],
    done: [{ id: "4", title: "Project structure" }],
  });

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumn = board[source.droppableId as keyof BoardState];
    const destColumn = board[destination.droppableId as keyof BoardState];

    const sourceTasks = Array.from(sourceColumn);
    const destTasks = Array.from(destColumn);

    const [movedTask] = sourceTasks.splice(source.index, 1);
    destTasks.splice(destination.index, 0, movedTask);

    setBoard({
      ...board,
      [source.droppableId]: sourceTasks,
      [destination.droppableId]: destTasks,
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6">
        <KanbanColumn title="Todo" droppableId="todo" tasks={board.todo} />
        <KanbanColumn
          title="In Progress"
          droppableId="inProgress"
          tasks={board.inProgress}
        />
        <KanbanColumn title="Done" droppableId="done" tasks={board.done} />
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
