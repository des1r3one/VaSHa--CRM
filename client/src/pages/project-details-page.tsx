import React, { useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  createdBy: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedTo: string;
  projectId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  avatar?: string;
}

interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedTo: string;
}

interface MemberFormData {
  userId: string;
  role: string;
}

export default function ProjectDetailsPage() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id || "";
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    assignedTo: "",
  });
  const [memberFormData, setMemberFormData] = useState<MemberFormData>({
    userId: "",
    role: "member",
  });

  // Fetch project details
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      return response.json();
    },
  });

  // Fetch project tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["projectTasks", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    },
  });

  // Fetch project members
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }
      return response.json();
    },
  });

  // Fetch all users for member selection
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, projectId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectTasks", projectId] });
      setTaskDialogOpen(false);
      setTaskFormData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: format(new Date(), "yyyy-MM-dd"),
        assignedTo: "",
      });
      toast({
        title: "Задача создана",
        description: "Новая задача успешно добавлена в проект",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось создать задачу: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to add member");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectMembers", projectId] });
      setMemberDialogOpen(false);
      setMemberFormData({
        userId: "",
        role: "member",
      });
      toast({
        title: "Участник добавлен",
        description: "Новый участник успешно добавлен в проект",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось добавить участника: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove member");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectMembers", projectId] });
      toast({
        title: "Участник удален",
        description: "Участник успешно удален из проекта",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить участника: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleTaskFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTaskFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTaskFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTaskMutation.mutate(taskFormData);
  };

  const handleMemberFormChange = (name: string, value: string) => {
    setMemberFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemberFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMemberMutation.mutate(memberFormData);
  };

  if (isLoadingProject) {
    return <div className="flex items-center justify-center h-96">Загрузка проекта...</div>;
  }

  if (!project) {
    return <div className="flex items-center justify-center h-96">Проект не найден</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "not started":
      case "не начат":
        return "bg-gray-200 text-gray-800";
      case "in progress":
      case "в процессе":
        return "bg-blue-200 text-blue-800";
      case "completed":
      case "завершен":
        return "bg-green-200 text-green-800";
      case "on hold":
      case "на паузе":
        return "bg-yellow-200 text-yellow-800";
      case "cancelled":
      case "отменен":
        return "bg-red-200 text-red-800";
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
            <span className="text-sm text-gray-500">
              {format(new Date(project.startDate), "dd.MM.yyyy")} - {format(new Date(project.endDate), "dd.MM.yyyy")}
            </span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="tasks">Задачи</TabsTrigger>
          <TabsTrigger value="members">Участники</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Описание проекта</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Задачи проекта</h2>
            <Button onClick={() => setTaskDialogOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Добавить задачу
            </Button>
          </div>

          {isLoadingTasks ? (
            <div className="flex items-center justify-center h-40">Загрузка задач...</div>
          ) : tasks && tasks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task: Task) => (
                <Card key={task.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                    </div>
                    <CardDescription>
                      Срок: {format(new Date(task.dueDate), "dd.MM.yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm line-clamp-3">{task.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    {users && task.assignedTo && (
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-1">
                          <AvatarImage src={users.find((u: User) => u.id === task.assignedTo)?.avatar} />
                          <AvatarFallback>
                            {users.find((u: User) => u.id === task.assignedTo)?.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">
                          {users.find((u: User) => u.id === task.assignedTo)?.name}
                        </span>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <p className="text-gray-500 mb-4">В этом проекте пока нет задач</p>
                <Button onClick={() => setTaskDialogOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Добавить первую задачу
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Участники проекта</h2>
            <Button onClick={() => setMemberDialogOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Добавить участника
            </Button>
          </div>

          {isLoadingMembers ? (
            <div className="flex items-center justify-center h-40">Загрузка участников...</div>
          ) : members && members.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {members.map((member: any) => (
                <Card key={member.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={member.user.avatar} />
                          <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{member.user.name}</CardTitle>
                          <CardDescription>{member.user.position}</CardDescription>
                        </div>
                      </div>
                      <Badge>{member.role}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm">{member.user.email}</p>
                    <p className="text-sm text-gray-500">{member.user.department}</p>
                  </CardContent>
                  <CardFooter className="pt-2">
                    {member.user.id !== project.createdBy && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={() => removeMemberMutation.mutate(member.id)}
                      >
                        <Trash2Icon className="h-4 w-4 mr-1" />
                        Удалить
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <p className="text-gray-500 mb-4">В этом проекте пока нет участников</p>
                <Button onClick={() => setMemberDialogOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Добавить первого участника
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить новую задачу</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTaskFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Название
                </label>
                <Input
                  id="title"
                  name="title"
                  value={taskFormData.title}
                  onChange={handleTaskFormChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Описание
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={taskFormData.description}
                  onChange={handleTaskFormChange}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Статус
                  </label>
                  <Select
                    value={taskFormData.status}
                    onValueChange={(value) => handleTaskFormChange({ target: { name: "status", value } } as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">К выполнению</SelectItem>
                      <SelectItem value="in progress">В процессе</SelectItem>
                      <SelectItem value="review">На проверке</SelectItem>
                      <SelectItem value="done">Выполнено</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="priority" className="text-sm font-medium">
                    Приоритет
                  </label>
                  <Select
                    value={taskFormData.priority}
                    onValueChange={(value) => handleTaskFormChange({ target: { name: "priority", value } } as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите приоритет" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="critical">Критический</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="dueDate" className="text-sm font-medium">
                    Срок выполнения
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      value={taskFormData.dueDate}
                      onChange={handleTaskFormChange}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="assignedTo" className="text-sm font-medium">
                    Исполнитель
                  </label>
                  <Select
                    value={taskFormData.assignedTo}
                    onValueChange={(value) => handleTaskFormChange({ target: { name: "assignedTo", value } } as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите исполнителя" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingUsers ? (
                        <SelectItem value="" disabled>
                          Загрузка пользователей...
                        </SelectItem>
                      ) : (
                        users &&
                        users.map((user: User) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTaskDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={addTaskMutation.isPending}>
                {addTaskMutation.isPending ? "Создание..." : "Создать задачу"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить участника проекта</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMemberFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="userId" className="text-sm font-medium">
                  Сотрудник
                </label>
                <Select
                  value={memberFormData.userId}
                  onValueChange={(value) => handleMemberFormChange("userId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите сотрудника" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingUsers ? (
                      <SelectItem value="" disabled>
                        Загрузка пользователей...
                      </SelectItem>
                    ) : (
                      users &&
                      users
                        .filter(
                          (user: User) =>
                            !members?.some((member: any) => member.user.id === user.id)
                        )
                        .map((user: User) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Роль в проекте
                </label>
                <Select
                  value={memberFormData.role}
                  onValueChange={(value) => handleMemberFormChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Менеджер</SelectItem>
                    <SelectItem value="member">Участник</SelectItem>
                    <SelectItem value="observer">Наблюдатель</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMemberDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={addMemberMutation.isPending || !memberFormData.userId}>
                {addMemberMutation.isPending ? "Добавление..." : "Добавить участника"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 