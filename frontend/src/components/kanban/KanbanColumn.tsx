import { Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import type { Task } from "./KanbanBoard";

type Props = {
  title: string;
  droppableId: string;
  tasks: Task[];
};

const KanbanColumn = ({ title, droppableId, tasks }: Props) => {
  return (
    <div className="flex-1 rounded-lg bg-muted p-4 flex flex-col">
      <h3 className="mb-4 font-semibold">{title}</h3>

      <Droppable droppableId={droppableId}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-3 min-h-[100px]"
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
