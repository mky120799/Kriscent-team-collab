import { useState } from "react";
import { useAppSelector } from "@/store/hooks";
import TeamMemberList from "@/components/team/TeamMemberList";
import ActivityLog from "@/components/team/ActivityLog";
import { Button } from "@/components/ui/button";
import AddMemberModal from "@/components/team/AddMemberModal";

const Team = () => {
  const user = useAppSelector((state) => state.auth.user);
  const teamId = user?.teamId;
  const [isAdding, setIsAdding] = useState(false);

  if (!teamId) return <p className="text-center py-20">No team found for this user.</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Overview</h1>
          <p className="text-muted-foreground mt-1">Manage your team members and track their activity.</p>
        </div>
        {(user?.role === "ADMIN" || user?.role === "MANAGER") && (
          <Button onClick={() => setIsAdding(true)} className="rounded-full px-6">
            + Add Member
          </Button>
        )}
      </div>

      <section className="bg-background rounded-xl p-6 border shadow-sm">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          Members
        </h2>
        <TeamMemberList teamId={teamId} />
      </section>

      <section className="bg-background rounded-xl p-6 border shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Activity Log</h2>
        <ActivityLog teamId={teamId} />
      </section>

      {isAdding && (
        <AddMemberModal teamId={teamId} onClose={() => setIsAdding(false)} />
      )}
    </div>
  );
};

export default Team;
