import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays } from "date-fns";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ListTodoIcon,
  Users2Icon,
  FolderIcon,
} from "lucide-react";

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  upcomingDeadlines: number;
  teamMembers: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  projectId: string;
  projectName: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export default function HomePage() {
  const { user } = useAuth();

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return response.json();
    },
  });

  // Fetch user's projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["userProjects", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user?.id}/projects`);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch user's tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["userTasks", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/users/${user?.id}/tasks`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch recent activity
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["recentActivity"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/activity");
      if (!response.ok) {
        throw new Error("Failed to fetch recent activity");
      }
      return response.json();
    },
  });

  // Task status data for pie chart
  const taskStatusData = [
    { name: "К выполнению", value: tasks?.filter((t: Task) => t.status === "todo").length || 0 },
    { name: "В процессе", value: tasks?.filter((t: Task) => t.status === "in progress").length || 0 },
    { name: "На проверке", value: tasks?.filter((t: Task) => t.status === "review").length || 0 },
    { name: "Выполнено", value: tasks?.filter((t: Task) => t.status === "done").length || 0 },
  ].filter((item) => item.value > 0);

  // Project progress data for bar chart
  const projectProgressData = projects?.slice(0, 5).map((project: Project) => ({
    name: project.name,
    progress: project.progress,
  })) || [];

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "todo":
      case "к выполнению":
        return "bg-gray-200 text-gray-800";
      case "in progress":
      case "в процессе":
        return "bg-blue-200 text-blue-800";
      case "review":
      case "на проверке":
        return "bg-purple-200 text-purple-800";
      case "done":
      case "выполнено":
        return "bg-green-200 text-green-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "low":
      case "низкий":
        return "bg-blue-200 text-blue-800";
      case "medium":
      case "средний":
        return "bg-yellow-200 text-yellow-800";
      case "high":
      case "высокий":
        return "bg-orange-200 text-orange-800";
      case "critical":
      case "критический":
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_created":
      case "task_updated":
        return <ListTodoIcon className="h-5 w-5 text-blue-500" />;
      case "task_completed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "project_created":
      case "project_updated":
        return <FolderIcon className="h-5 w-5 text-purple-500" />;
      case "member_added":
        return <Users2Icon className="h-5 w-5 text-orange-500" />;
      case "deadline_approaching":
        return <ClockIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CalendarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Добро пожаловать, {user?.name}!</h1>
        <div className="flex gap-2">
          <Link href="/tasks">
            <Button variant="outline">
              <ListTodoIcon className="h-4 w-4 mr-2" />
              Мои задачи
            </Button>
          </Link>
          <Link href="/projects">
            <Button>
              <FolderIcon className="h-4 w-4 mr-2" />
              Проекты
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      {isLoadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-32 animate-pulse">
              <div className="h-full bg-gray-200 rounded-lg"></div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Проекты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">{stats?.activeProjects}</div>
                <div className="text-sm text-gray-500">
                  из {stats?.totalProjects} активны
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Задачи</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">{stats?.completedTasks}</div>
                <div className="text-sm text-gray-500">
                  из {stats?.totalTasks} выполнены
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Ближайшие дедлайны</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold">{stats?.upcomingDeadlines}</div>
                <div className="text-sm text-gray-500">в ближайшие 7 дней</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Прогресс проектов</CardTitle>
            <CardDescription>Статус выполнения ваших проектов</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProjects ? (
              <div className="h-64 animate-pulse bg-gray-200 rounded-lg"></div>
            ) : projectProgressData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={projectProgressData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="progress" fill="#8884d8" name="Прогресс (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                У вас пока нет активных проектов
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Distribution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Распределение задач</CardTitle>
            <CardDescription>Статусы ваших текущих задач</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTasks ? (
              <div className="h-64 animate-pulse bg-gray-200 rounded-lg"></div>
            ) : taskStatusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                У вас пока нет назначенных задач
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Недавние задачи</CardTitle>
            <CardDescription>Ваши последние назначенные задачи</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTasks ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 animate-pulse bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.slice(0, 5).map((task: Task) => (
                  <div key={task.id} className="flex items-start justify-between border-b pb-4">
                    <div>
                      <Link href={`/tasks/${task.id}`}>
                        <h3 className="font-medium hover:text-blue-600 hover:underline">
                          {task.title}
                        </h3>
                      </Link>
                      <div className="text-sm text-gray-500 mt-1">
                        Проект:{" "}
                        <Link href={`/projects/${task.projectId}`}>
                          <span className="text-blue-600 hover:underline">
                            {task.projectName}
                          </span>
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                      <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      <span className="text-sm text-gray-500">
                        {format(new Date(task.dueDate), "dd.MM.yyyy")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-500">
                У вас пока нет назначенных задач
              </div>
            )}
          </CardContent>
          {tasks && tasks.length > 5 && (
            <CardFooter>
              <Link href="/tasks">
                <Button variant="outline" className="w-full">
                  Посмотреть все задачи
                </Button>
              </Link>
            </CardFooter>
          )}
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Недавняя активность</CardTitle>
            <CardDescription>Последние события в системе</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.slice(0, 7).map((activity: Activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <p className="text-sm">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={activity.user.avatar} />
                          <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">
                          {activity.user.name} • {format(new Date(activity.timestamp), "dd.MM HH:mm")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-500">
                Нет недавней активности
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
