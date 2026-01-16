import { Draggable } from "@hello-pangea/dnd";

const TaskCard = ({ task, index }: any) => {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-card rounded p-3 shadow"
        >
          <h4 className="font-medium">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
