import { type TeamMember } from "@/types/team";
import { useAppSelector } from "@/store/hooks";
import { useUpdateMemberRoleMutation } from "@/store/services/team.api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  member: TeamMember;
};

const TeamMemberCard = ({ member }: Props) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [updateRole, { isLoading }] = useUpdateMemberRoleMutation();

  const handleRoleChange = async (newRole: string) => {
    try {
      await updateRole({ userId: member._id, role: newRole }).unwrap();
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const isAdmin = currentUser?.role === "ADMIN";
  const isSelf = currentUser?._id === member._id;

  return (
    <div className="p-5 bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow group relative">
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-lg">{member.name}</h3>
        <p className="text-sm text-muted-foreground">{member.email}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
            Role
          </span>
          {isAdmin && !isSelf ? (
            <Select
              disabled={isLoading}
              defaultValue={member.role}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger className="h-7 w-[110px] text-xs font-semibold bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border",
                member.role === "ADMIN"
                  ? "bg-red-50 text-red-700 border-red-100"
                  : member.role === "MANAGER"
                    ? "bg-blue-50 text-blue-700 border-blue-100"
                    : "bg-slate-50 text-slate-700 border-slate-100",
              )}
            >
              {member.role}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamMemberCard;
