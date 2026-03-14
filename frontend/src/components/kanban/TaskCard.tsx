import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { type Task } from "@/store/services/task.api";
import EditTaskModal from "../tasks/EditTaskModal";

interface TaskCardProps {
  task: Task;
  index: number;
}

const TaskCard = ({ task, index }: TaskCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <Draggable draggableId={task._id} index={index}>
        {(provided) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => setIsEditing(true)}
            className="mb-2 shadow-sm border-l-4 border-l-primary cursor-pointer hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-1 pt-3 font-semibold text-sm">
              {task.title}
            </CardHeader>
            <CardContent className="pb-3 text-xs">
              {task.description && (
                <p className="text-muted-foreground mb-2 line-clamp-2">
                  {task.description}
                </p>
              )}
              {task.assignedTo && typeof task.assignedTo !== "string" && (
                <div className="flex items-center gap-1 text-[10px] bg-muted px-2 py-0.5 rounded-full w-fit text-muted-foreground">
                  <span className="font-medium">@{task.assignedTo.name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </Draggable>

      {isEditing && (
        <EditTaskModal task={task} onClose={() => setIsEditing(false)} />
      )}
    </>
  );
};

export default TaskCard;
