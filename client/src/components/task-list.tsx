import * as React from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { StatusBadge, StatusType } from "./ui/status-badge";
import { Card, CardContent } from "./ui/card";

interface Task {
  id: string;
  title: string;
  description: string;
  status: StatusType;
  dueDate: string | Date;
  assignedTo: {
    id: string;
    name: string;
    avatar?: string;
  };
  project: {
    id: string;
    name: string;
  };
}

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isLoading = false,
  emptyMessage = "Нет задач для отображения",
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

  if (tasks.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {tasks.map((task) => (
        <Link key={task.id} href={`/tasks/${task.id}`}>
          <a className="block">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {task.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {task.description}
                    </p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="mr-2">Проект:</span>
                      <span className="font-medium text-gray-900">
                        {task.project.name}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <span className="mr-2">Исполнитель:</span>
                      <span className="font-medium text-gray-900">
                        {task.assignedTo.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <StatusBadge status={task.status} />
                    <span className="text-sm text-gray-500">
                      {format(
                        new Date(task.dueDate),
                        "d MMMM yyyy",
                        { locale: ru }
                      )}
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

export { TaskList, type Task }; 