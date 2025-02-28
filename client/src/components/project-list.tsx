import * as React from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { StatusBadge, StatusType } from "./ui/status-badge";
import { Card, CardContent } from "./ui/card";

interface Project {
  id: string;
  name: string;
  description: string;
  status: StatusType;
  startDate: string | Date;
  endDate: string | Date;
  members: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  tasksCount: number;
}

interface ProjectListProps {
  projects: Project[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  isLoading = false,
  emptyMessage = "Нет проектов для отображения",
  className = "",
}) => {
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-24"></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`}>
          <a className="block">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {project.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="mr-2">Период:</span>
                      <span className="font-medium text-gray-900">
                        {format(new Date(project.startDate), "d MMM yyyy", {
                          locale: ru,
                        })}{" "}
                        -{" "}
                        {format(new Date(project.endDate), "d MMM yyyy", {
                          locale: ru,
                        })}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <span className="mr-2">Участников:</span>
                      <span className="font-medium text-gray-900">
                        {project.members.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <StatusBadge status={project.status} />
                    <span className="text-sm text-gray-500">
                      Задач: {project.tasksCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        </Link>
      ))}
    </div>
  );
};

export { ProjectList, type Project }; 