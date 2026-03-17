import { useState } from "react";
import { useSearchUsersQuery } from "@/store/services/user.api";
import { useAddTeamMemberMutation } from "@/store/services/team.api";
import { Button } from "@/components/ui/button";

type Props = {
  teamId: string;
  onClose: () => void;
};

const AddMemberModal = ({ teamId, onClose }: Props) => {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("MEMBER");
  const { data: users = [], isLoading } = useSearchUsersQuery(search, {
    skip: search.length < 3,
  });
  const [addMember, { isLoading: isAdding }] = useAddTeamMemberMutation();

  const handleAdd = async (userId: string) => {
    try {
      await addMember({ teamId, userId, role: selectedRole }).unwrap();
      onClose();
    } catch (err) {
      console.error("Failed to add member:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl p-6 w-full max-w-md border">
        <h2 className="text-xl font-bold mb-4">Add Team Member</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block text-muted-foreground">
              1. Select Role
            </label>
            <div className="flex gap-2">
              <Button
                variant={selectedRole === "MEMBER" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setSelectedRole("MEMBER")}
              >
                Member
              </Button>
              <Button
                variant={selectedRole === "MANAGER" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setSelectedRole("MANAGER")}
              >
                Manager
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block text-muted-foreground">
              2. Search User
            </label>
            <input
              className="w-full border rounded-md p-2 bg-background focus:ring-2 focus:ring-primary outline-none"
              placeholder="Min 3 characters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
            {isLoading && <p className="text-sm text-center">Searching...</p>}
            {search.length >= 3 && users.length === 0 && !isLoading && (
              <p className="text-sm text-center text-muted-foreground">
                No users found.
              </p>
            )}
            {users.map((user) => (
              <div
                key={user._id}
                className="flex justify-between items-center p-2 hover:bg-muted rounded transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isAdding || user.teamId === teamId}
                  onClick={() => handleAdd(user._id)}
                >
                  {user.teamId === teamId ? "In Team" : "Add"}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
