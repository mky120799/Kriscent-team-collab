import { type TeamMember } from "@/types/team";

type Props = {
  member: TeamMember;
};

const TeamMemberCard = ({ member }: Props) => (
  <div className="p-4 border rounded shadow hover:shadow-md">
    <h3 className="font-semibold">{member.name}</h3>
    <p className="text-sm text-muted-foreground">{member.email}</p>
    <span className="text-xs font-medium bg-gray-200 px-2 py-1 rounded">{member.role}</span>
  </div>
);

export default TeamMemberCard;