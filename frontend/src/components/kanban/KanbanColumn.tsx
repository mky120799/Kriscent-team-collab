import { Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";

const KanbanColumn = ({ title, columnId, tasks }: any) => {
  return (
    <div className="w-80 bg-muted rounded p-3 flex flex-col">
      <h3 className="font-semibold mb-3">{title}</h3>

      <Droppable droppableId={columnId}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 space-y-2 overflow-y-auto"
          >
            {tasks.map((task: any, index: number) => (
              <TaskCard key={task._id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
