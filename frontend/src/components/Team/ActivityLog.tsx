import { useGetActivityLogsQuery } from "@/store/services/team.api";

type Props = { teamId: string };

const ActivityLog = ({ teamId }: Props) => {
  const {
    data: logs,
    isLoading,
    error,
  } = useGetActivityLogsQuery(teamId, { skip: !teamId });

  if (isLoading) return <p className="text-sm">Loading activity logs...</p>;
  if (error)
    return <p className="text-sm text-destructive">Failed to load activity.</p>;
  if (!logs || logs.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        No recent activity logs found for this team.
      </p>
    );

  return (
    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
      {logs.map((log) => {
        const userName = log.performedBy?.name || "System";
        const actionName =
          log.action.toLowerCase() === "create"
            ? "created"
            : log.action.toLowerCase();

        return (
          <div
            key={log._id}
            className="text-sm border-b pb-3 last:border-0 last:pb-0"
          >
            <div>
              <span className="font-semibold text-foreground">{userName}</span>
              <span className="text-muted-foreground">
                {" "}
                {actionName} a {log.entity.toLowerCase()}
              </span>
              {log.metadata?.title && (
                <span className="font-medium italic">
                  {" "}
                  "{log.metadata.title}"
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(log.createdAt).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityLog;
