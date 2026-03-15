import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateProjectMutation } from "@/store/services/project.api";
import { useGetTeamsQuery } from "@/store/services/team.api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSelector } from "@/store/hooks";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description?: string;
    teamId: string;
  }) => void;
};

const CreateProjectModal = ({ open, onClose, onCreate }: Props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState("");

  const { data: teams = [], isLoading: isLoadingTeams } = useGetTeamsQuery();
  const [createProject, { isLoading }] = useCreateProjectMutation();
  const user = useAppSelector((state) => state.auth.user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Always fallback to user's teamId if no dropdown is shown (e.g. for simple managers)
    const finalTeam = teamId || user?.teamId;

    if (!finalTeam) return;

    try {
      await createProject({ name, description, teamId: finalTeam }).unwrap();
      onCreate({ name, description, teamId: finalTeam });
      setName("");
      setDescription("");
      setTeamId("");
      onClose();
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="e.g. Website Redesign"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="What is this project about?"
            />
          </div>

          {!isLoadingTeams && teams.length > 0 && user?.role === "ADMIN" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign To Team</label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select team for project" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
