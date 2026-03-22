import { useNavigate, useParams } from "react-router-dom";
import KanbanBoard from "../components/kanban/KanbanBoard";
import CreateTaskButton from "../components/tasks/CreateTaskButton";
import AssistantInput from "../components/assistant/AssistantInput";
import { useAppSelector } from "@/store/hooks";
import { useGetProjectsQuery } from "@/store/services/project.api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Tasks = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { data: projects = [] } = useGetProjectsQuery();
  const role = user?.role;

  return (
    <div className="p-4 md:p-6 space-y-4 flex flex-col h-full">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-card p-4 rounded-lg border shadow-sm gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <Select
            value={projectId || ""}
            onValueChange={(val) => navigate(`/tasks/${val}`)}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {projectId && (role === "ADMIN" || role === "MANAGER") && (
          <div className="w-full lg:w-auto">
             <CreateTaskButton projectId={projectId} role={role} />
          </div>
        )}
      </div>

      {projectId && (role === "ADMIN" || role === "MANAGER") && (
        <AssistantInput projectId={projectId} />
      )}

      {projectId ? (
        <div className="flex-1 overflow-hidden">
          <KanbanBoard projectId={projectId} />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center border-2 border-dashed rounded-lg bg-muted/20">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-medium">No Project Selected</h2>
            <p className="text-muted-foreground">
              Select a project from the dropdown above to view tasks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
