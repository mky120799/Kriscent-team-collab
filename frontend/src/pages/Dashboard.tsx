import { useGetProjectsQuery } from "@/store/services/project.api";
import { useGetTasksByProjectQuery } from "@/store/services/task.api";
import StatsCard from "@/components/dashboard/StatsCard";
import ProjectSummary from "@/components/dashboard/ProjectSummary";
import ActivityList from "@/components/dashboard/Activity";

const Dashboard = () => {
  const { data: projects, isLoading: projectsLoading } = useGetProjectsQuery();
  const projectId = projects?.[0]?._id;

  const { data: tasks, isLoading: tasksLoading } = useGetTasksByProjectQuery(projectId!, {
    skip: !projectId,
  });

  const totalProjects = projects?.length || 0;
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t) => t.status === "done").length || 0;
  const pendingTasks = tasks?.filter((t) => t.status !== "done").length || 0;

  if (projectsLoading || tasksLoading)
    return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Projects" value={totalProjects} />
        <StatsCard title="Total Tasks" value={totalTasks} />
        <StatsCard title="Completed Tasks" value={completedTasks} />
        <StatsCard title="Pending Tasks" value={pendingTasks} />
      </div>

      {/* Projects overview */}
      <ProjectSummary projects={projects || []} />

      {/* Recent activity */}
      <ActivityList />
    </div>
  );
};

export default Dashboard;
