import { useGetTeamMembersQuery } from "@/store/services/team.api";
import TeamMemberCard from "./TeamMemberCard";

type Props = { teamId: string };

const TeamMemberList = ({ teamId }: Props) => {
  const {
    data: members,
    isLoading,
    error,
  } = useGetTeamMembersQuery(teamId, { skip: !teamId });

  if (isLoading) return <p>Loading team members...</p>;
  if (error) return <p>Failed to load members.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {members?.map((member) => (
        <TeamMemberCard key={member._id} member={member} />
      ))}
    </div>
  );
};

export default TeamMemberList;