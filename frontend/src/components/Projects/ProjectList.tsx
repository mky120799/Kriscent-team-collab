import { useNavigate } from "react-router-dom";
import { useGetProjectsQuery } from "@/store/services/project.api";
import ProjectCard from "./ProjectCard";

const ProjectList = () => {
  const { data, isLoading, error } = useGetProjectsQuery();
  const navigate = useNavigate();

  if (isLoading) return <p>Loading projects...</p>;
  if (error) return <p>Failed to load projects</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data?.map((project) => (
        <ProjectCard
          key={project._id}
          project={project}
          onClick={() => navigate(`/projects/${project._id}/tasks`)}
        />
      ))}
    </div>
  );
};

export default ProjectList;