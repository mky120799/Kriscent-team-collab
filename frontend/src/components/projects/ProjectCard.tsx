import type{ Project } from "@/types/project";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type Props = {
  project: Project;
  onClick: () => void;
};

const ProjectCard = ({ project, onClick }: Props) => {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-md transition"
    >
      <CardHeader className="font-semibold">
        {project.name}
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {project.description || "No description"}
      </CardContent>
    </Card>
  );
};

export default ProjectCard;