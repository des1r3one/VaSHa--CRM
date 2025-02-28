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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ArrowLeftIcon, PencilIcon, MailIcon, PhoneIcon, BuildingIcon, BriefcaseIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  phone: string;
  bio: string;
  avatar?: string;
  joinDate: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  projectId: string;
  projectName: string;
}

interface UserFormData {
  name: string;
  email: string;
  position: string;
  department: string;
  phone: string;
  bio: string;
}

export default function EmployeeProfilePage() {
  const [, params] = useRoute("/employees/:id");
  const userId = params?.id || "";
  const { user: currentUser } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    name: "",
    email: "",
    position: "",
    department: "",
    phone: "",
    bio: "",
  });

  // Fetch user details
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setUserFormData({
        name: data.name,
        email: data.email,
        position: data.position,
        department: data.department,
        phone: data.phone || "",
        bio: data.bio || "",
      });
    },
  });

  // Fetch user projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["userProjects", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/projects`);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      return response.json();
    },
  });

  // Fetch user tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["userTasks", userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/tasks`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      setEditDialogOpen(false);
      toast({
        title: "Профиль обновлен",
        description: "Изменения успешно сохранены",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось обновить профиль: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleUserFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate(userFormData);
  };

  if (isLoadingUser) {
    return <div className="flex items-center justify-center h-96">Загрузка профиля...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center h-96">Сотрудник не найден</div>;
  }

  const isCurrentUser = currentUser?.id === user.id;
  const canEdit = isCurrentUser || currentUser?.role === "admin";

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
      <div className="flex items-center gap-2 mb-6">
        <Link href="/employees">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Назад к списку сотрудников
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold text-center">{user.name}</h1>
              <p className="text-gray-500 text-center mt-1">{user.position}</p>
              <Badge className="mt-2">{user.department}</Badge>

              {canEdit && (
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Редактировать профиль
                </Button>
              )}
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center">
                <MailIcon className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{user.email}</p>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Телефон</p>
                    <p>{user.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center">
                <BuildingIcon className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Отдел</p>
                  <p>{user.department}</p>
                </div>
              </div>
              <div className="flex items-center">
                <BriefcaseIcon className="h-5 w-5 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Должность</p>
                  <p>{user.position}</p>
                </div>
              </div>
            </div>

            {user.joinDate && (
              <>
                <Separator className="my-6" />
                <div>
                  <p className="text-sm text-gray-500">В компании с</p>
                  <p>{format(new Date(user.joinDate), "dd.MM.yyyy")}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {user.bio && (
            <Card>
              <CardHeader>
                <CardTitle>О сотруднике</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{user.bio}</p>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="projects">Проекты</TabsTrigger>
              <TabsTrigger value="tasks">Задачи</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="mt-6">
              {isLoadingProjects ? (
                <div className="flex items-center justify-center h-40">Загрузка проектов...</div>
              ) : projects && projects.length > 0 ? (
                <div className="grid gap-4">
                  {projects.map((project: Project) => (
                    <Card key={project.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>
                              <Link href={`/projects/${project.id}`}>
                                <span className="text-blue-600 hover:underline">{project.name}</span>
                              </Link>
                            </CardTitle>
                            <CardDescription>Роль: {project.role}</CardDescription>
                          </div>
                          <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm line-clamp-2">{project.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-40">
                    <p className="text-gray-500">Сотрудник не участвует ни в одном проекте</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              {isLoadingTasks ? (
                <div className="flex items-center justify-center h-40">Загрузка задач...</div>
              ) : tasks && tasks.length > 0 ? (
                <div className="grid gap-4">
                  {tasks.map((task: Task) => (
                    <Card key={task.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>
                              <Link href={`/tasks/${task.id}`}>
                                <span className="text-blue-600 hover:underline">{task.title}</span>
                              </Link>
                            </CardTitle>
                            <CardDescription>
                              Проект:{" "}
                              <Link href={`/projects/${task.projectId}`}>
                                <span className="text-blue-600 hover:underline">{task.projectName}</span>
                              </Link>
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm line-clamp-2">{task.description}</p>
                      </CardContent>
                      <CardFooter>
                        <p className="text-sm text-gray-500">
                          Срок: {format(new Date(task.dueDate), "dd.MM.yyyy")}
                        </p>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-40">
                    <p className="text-gray-500">У сотрудника нет назначенных задач</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUserFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Имя
                </label>
                <Input
                  id="name"
                  name="name"
                  value={userFormData.name}
                  onChange={handleUserFormChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={userFormData.email}
                  onChange={handleUserFormChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="position" className="text-sm font-medium">
                    Должность
                  </label>
                  <Input
                    id="position"
                    name="position"
                    value={userFormData.position}
                    onChange={handleUserFormChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="department" className="text-sm font-medium">
                    Отдел
                  </label>
                  <Input
                    id="department"
                    name="department"
                    value={userFormData.department}
                    onChange={handleUserFormChange}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Телефон
                </label>
                <Input
                  id="phone"
                  name="phone"
                  value={userFormData.phone}
                  onChange={handleUserFormChange}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="bio" className="text-sm font-medium">
                  О себе
                </label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={userFormData.bio}
                  onChange={handleUserFormChange}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 