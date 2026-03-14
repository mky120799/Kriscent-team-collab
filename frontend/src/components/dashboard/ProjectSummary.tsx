

import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface Project {
  _id: string;
  name: string;
  description?: string;
}

interface ProjectSummaryProps {
  projects?: Project[];
}

const ProjectSummary = ({ projects = [] }: ProjectSummaryProps) => {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Projects Overview</h2>
      {projects.length ? (
        <ul className="space-y-2">
          {projects.map((project) => (
            <Card key={project._id}>
              <CardHeader>{project.name}</CardHeader>
              <CardContent>{project.description || "No description"}</CardContent>
            </Card>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No projects available</p>
      )}
    </div>
  );
};

export default ProjectSummary;