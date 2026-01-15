import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { type Task } from "./KanbanBoard";

type Props = {
  task: Task;
  index: number;
};

const TaskCard = ({ task, index }: Props) => {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <Card className="cursor-grab active:cursor-grabbing">
            <CardHeader className="p-3">
              <p className="font-medium text-sm">{task.title}</p>
            </CardHeader>

            <CardContent className="p-3 pt-0 text-xs text-muted-foreground">
              Task details here
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default TaskCard;
