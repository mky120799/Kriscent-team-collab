import { useState } from "react";
import { useGetProjectsQuery } from "@/store/services/project.api";
import ProjectCard from "@/components/projects/ProjectCard";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Projects = () => {
  const navigate = useNavigate();
  const { data: projects, isLoading, error } = useGetProjectsQuery();
  const [openModal, setOpenModal] = useState(false);

  const handleCreateProject = (data: {
    name: string;
    description?: string;
  }) => {
    console.log("Creating project:", data);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-card p-4 md:p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage and track your team's initiatives.
          </p>
        </div>
        <Button
          onClick={() => setOpenModal(true)}
          className="rounded-full px-6 w-full sm:w-auto"
        >
          + New Project
        </Button>
      </div>

      {isLoading && <p className="text-center py-10">Loading projects...</p>}
      {error && (
        <p className="text-center py-10 text-destructive">
          Failed to load projects.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project) => (
          <ProjectCard
            key={project._id}
            project={project}
            onClick={() => navigate(`/tasks/${project._id}`)}
          />
        ))}
      </div>

      <CreateProjectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
};

export default Projects;
