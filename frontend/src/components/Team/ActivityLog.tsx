import { useGetActivityLogsQuery } from "@/store/services/team.api";

type Props = { teamId: string };

const ActivityLog = ({ teamId }: Props) => {
  const { data: logs, isLoading, error } = useGetActivityLogsQuery(teamId);

  if (isLoading) return <p>Loading activity logs...</p>;
  if (error) return <p>Failed to load activity.</p>;

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {logs?.map((log) => (
        <div key={log._id} className="text-sm text-muted-foreground">
          {new Date(log.timestamp).toLocaleString()} – {log.message}
        </div>
      ))}
    </div>
  );
};

export default ActivityLog;