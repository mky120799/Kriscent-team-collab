import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useGetActivityLogsQuery } from "@/store/services/activity.api";

const ActivityList = () => {
  const { data: activities = [], isLoading } = useGetActivityLogsQuery();

  if (isLoading) return <p>Loading activity...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Recent Activity</h2>
      {activities.length ? (
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity) => (
            <Card key={activity._id}>
              <CardHeader className="py-2 text-xs text-muted-foreground">
                {new Date(activity.createdAt).toLocaleString()}
              </CardHeader>
              <CardContent className="py-2 text-sm">
                <span className="font-medium">{activity.action.replace("_", " ")}</span> by {activity.performedBy?.name}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm italic">No recent activity</p>
      )}
    </div>
  );
};

export default ActivityList;