import { useGetActivityLogsQuery, type ActivityLog } from "../store/services/activity.api";

const Activity = () => {
  const { data = [], isLoading } = useGetActivityLogsQuery();

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="p-6 space-y-3">
      <h2 className="text-xl font-semibold">Activity Logs</h2>

      {(data as ActivityLog[]).map((log) => (
        <div key={log._id} className="border rounded p-3 bg-muted">
          <p className="font-medium">{log.action.replace("_", " ")}</p>
          <p className="text-sm text-muted-foreground">
            By {log.performedBy?.name} ·{" "}
            {new Date(log.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default Activity;
