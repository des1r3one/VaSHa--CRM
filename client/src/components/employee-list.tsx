import * as React from "react";
import { Link } from "wouter";
import { Avatar } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  avatar?: string;
  projectsCount: number;
  tasksCount: number;
}

interface EmployeeListProps {
  employees: Employee[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  isLoading = false,
  emptyMessage = "Нет сотрудников для отображения",
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

  if (employees.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {employees.map((employee) => (
        <Link key={employee.id} href={`/employees/${employee.id}`}>
          <a className="block">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Avatar
                    src={employee.avatar}
                    name={employee.name}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {employee.name}
                    </h3>
                    <p className="text-sm text-gray-500">{employee.position}</p>
                    <p className="text-sm text-gray-500">
                      {employee.department}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <div className="text-sm text-gray-500">
                      Проектов: {employee.projectsCount}
                    </div>
                    <div className="text-sm text-gray-500">
                      Задач: {employee.tasksCount}
                    </div>
                    <div className="text-sm text-blue-600 hover:underline">
                      Подробнее
                    </div>
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

export { EmployeeList, type Employee }; 