import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import TeamMemberList from "@/components/team/TeamMemberList";
import ActivityLog from "@/components/team/ActivityLog";
import { Button } from "@/components/ui/button";
import AddMemberModal from "@/components/team/AddMemberModal";
import CreateTeamModal from "@/components/team/CreateTeamModal";
import { useGetTeamsQuery } from "@/store/services/team.api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const Team = () => {
  const user = useAppSelector((state) => state.auth.user);
  const { data: teams = [], isLoading } = useGetTeamsQuery();

  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      // Default to either the user's primary team, or the first team loaded.
      const defaultTeamId =
        user?.teamId && teams.find((t) => t._id === user.teamId)
          ? user.teamId
          : teams[0]._id;

      setSelectedTeamId(defaultTeamId);
    }
  }, [teams, user?.teamId, selectedTeamId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <h2 className="text-2xl font-bold">No Teams Found</h2>
        <p className="text-muted-foreground">
          You do not belong to any team currently.
        </p>
        {user?.role === "ADMIN" && (
          <Button onClick={() => setIsCreating(true)}>Create A Team</Button>
        )}
        {isCreating && <CreateTeamModal onClose={() => setIsCreating(false)} />}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-card p-4 md:p-6 rounded-xl border shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Team Overview</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Select a team to manage its members and view activity logs.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t._id} value={t._id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {user?.role === "ADMIN" && (
              <Button
                variant="outline"
                onClick={() => setIsCreating(true)}
                className="rounded-md w-full sm:w-auto"
              >
                Create Team
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-background rounded-xl p-4 md:p-6 border shadow-sm gap-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Members
        </h2>
        {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
          <Button
            onClick={() => setIsAdding(true)}
            className="rounded-full px-6 w-full sm:w-auto"
          >
            + Add Member to this Team
          </Button>
        )}
      </div>

      <section className="bg-background rounded-xl p-6 border shadow-sm">
        <TeamMemberList teamId={selectedTeamId} />
      </section>

      <section className="bg-background rounded-xl p-6 border shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Activity Log</h2>
        <ActivityLog teamId={selectedTeamId} />
      </section>

      {isAdding && (
        <AddMemberModal
          teamId={selectedTeamId}
          onClose={() => setIsAdding(false)}
        />
      )}

      {isCreating && <CreateTeamModal onClose={() => setIsCreating(false)} />}
    </div>
  );
};

export default Team;
