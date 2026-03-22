import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import ChatWindow from "@/components/chat/ChatWindow";
import { useGetTeamsQuery } from "@/store/services/team.api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Chat = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { data: teams = [] } = useGetTeamsQuery();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  useEffect(() => {
    if (user?.teamId && !selectedTeamId) {
      setSelectedTeamId(user.teamId);
    }
  }, [user, selectedTeamId]);

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="p-4 md:p-6 space-y-4 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-card p-4 rounded-lg border shadow-sm gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
          <h1 className="text-2xl font-bold whitespace-nowrap">Team Chat</h1>
          {isAdmin && teams.length > 0 && (
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Select team chat" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t._id} value={t._id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {selectedTeamId ? (
        <ChatWindow teamId={selectedTeamId} />
      ) : (
        <div className="flex items-center justify-center h-full border rounded border-dashed">
          <p className="text-muted-foreground">Please select a team chat</p>
        </div>
      )}
    </div>
  );
};

export default Chat;
