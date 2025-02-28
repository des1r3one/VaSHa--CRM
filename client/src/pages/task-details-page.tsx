import React, { useState } from "react";
import { useRoute, Link } from "wouter";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeftIcon, PlusIcon, PencilIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedTo: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  avatar?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: User;
}

interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedTo: string;
}

export default function TaskDetailsPage() {
  const [, params] = useRoute("/tasks/:id");
  const taskId = params?.id || "";
  const { user } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    assignedTo: "",
  });

  // Fetch task details
  const { data: task, isLoading: isLoadingTask } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch task");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setTaskFormData({
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: format(new Date(data.dueDate), "yyyy-MM-dd"),
        assignedTo: data.assignedTo,
      });
    },
  });

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: ["project", task?.projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${task.projectId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      return response.json();
    },
    enabled: !!task?.projectId,
  });

  // Fetch task comments
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ["taskComments", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/comments`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      return response.json();
    },
  });

  // Fetch all users for assignment
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

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      setEditDialogOpen(false);
      toast({
        title: "Задача обновлена",
        description: "Изменения успешно сохранены",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось обновить задачу: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskComments", taskId] });
      setCommentText("");
      toast({
        title: "Комментарий добавлен",
        description: "Ваш комментарий успешно добавлен",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось добавить комментарий: ${error.message}`,
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
    updateTaskMutation.mutate(taskFormData);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      addCommentMutation.mutate(commentText);
    }
  };

  if (isLoadingTask) {
    return <div className="flex items-center justify-center h-96">Загрузка задачи...</div>;
  }

  if (!task) {
    return <div className="flex items-center justify-center h-96">Задача не найдена</div>;
  }

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

  const assignedUser = users?.find((u: User) => u.id === task.assignedTo);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        {project && (
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Назад к проекту
            </Button>
          </Link>
        )}
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{task.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
            <span className="text-sm text-gray-500">
              Срок: {format(new Date(task.dueDate), "dd.MM.yyyy")}
            </span>
          </div>
        </div>
        <Button onClick={() => setEditDialogOpen(true)}>
          <PencilIcon className="h-4 w-4 mr-2" />
          Редактировать
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Описание задачи</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{task.description}</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Комментарии</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Добавить комментарий..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="mb-2"
                  />
                  <Button type="submit" disabled={!commentText.trim() || addCommentMutation.isPending}>
                    {addCommentMutation.isPending ? "Отправка..." : "Отправить"}
                  </Button>
                </div>
              </div>
            </form>

            {isLoadingComments ? (
              <div className="flex items-center justify-center h-20">Загрузка комментариев...</div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-6">
                {comments.map((comment: Comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.user.avatar} />
                      <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{comment.user.name}</span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(comment.createdAt), "dd.MM.yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                Нет комментариев. Будьте первым, кто оставит комментарий!
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Детали</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Проект</h4>
                  <Link href={`/projects/${project.id}`}>
                    <span className="text-blue-600 hover:underline">{project.name}</span>
                  </Link>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Исполнитель</h4>
                {assignedUser ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={assignedUser.avatar} />
                      <AvatarFallback>{assignedUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{assignedUser.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-500">Не назначен</span>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Создана</h4>
                <span>{format(new Date(task.createdAt), "dd.MM.yyyy HH:mm")}</span>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Обновлена</h4>
                <span>{format(new Date(task.updatedAt), "dd.MM.yyyy HH:mm")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать задачу</DialogTitle>
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
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={updateTaskMutation.isPending}>
                {updateTaskMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 