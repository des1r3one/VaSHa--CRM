import React, { useState } from "react";
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
import { PencilIcon, KeyIcon, MailIcon, PhoneIcon, BuildingIcon, BriefcaseIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ProfileFormData {
  name: string;
  email: string;
  position: string;
  department: string;
  phone: string;
  bio: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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
  status: string;
  priority: string;
  dueDate: string;
  projectId: string;
  projectName: string;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState<ProfileFormData>({
    name: user?.name || "",
    email: user?.email || "",
    position: user?.position || "",
    department: user?.department || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
  });
  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      return response.json();
    },
    onSuccess: (data) => {
      updateUser(data);
      setEditProfileDialogOpen(false);
      toast({
        title: "Профиль обновлен",
        description: "Ваш профиль успешно обновлен",
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

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch(`/api/users/${user?.id}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to change password");
      }

      return response.json();
    },
    onSuccess: () => {
      setChangePasswordDialogOpen(false);
      setPasswordFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Пароль изменен",
        description: "Ваш пароль успешно изменен",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось изменить пароль: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleProfileFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordFormChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setPasswordFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileFormData);
  };

  const handlePasswordFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Новый пароль и подтверждение не совпадают",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordFormData.currentPassword,
      newPassword: passwordFormData.newPassword,
    });
  };

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

  if (!user) {
    return <div className="flex items-center justify-center h-96">Загрузка профиля...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Мой профиль</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold text-center">{user.name}</h2>
              <p className="text-gray-500 text-center mt-1">{user.position}</p>
              <Badge className="mt-2">{user.department}</Badge>

              <div className="flex gap-2 mt-4 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditProfileDialogOpen(true)}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Редактировать
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setChangePasswordDialogOpen(true)}
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Пароль
                </Button>
              </div>
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
                <CardTitle>О себе</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{user.bio}</p>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="projects">Мои проекты</TabsTrigger>
              <TabsTrigger value="tasks">Мои задачи</TabsTrigger>
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
                              <a href={`/projects/${project.id}`} className="text-blue-600 hover:underline">
                                {project.name}
                              </a>
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
                    <p className="text-gray-500">Вы не участвуете ни в одном проекте</p>
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
                              <a href={`/tasks/${task.id}`} className="text-blue-600 hover:underline">
                                {task.title}
                              </a>
                            </CardTitle>
                            <CardDescription>
                              Проект:{" "}
                              <a href={`/projects/${task.projectId}`} className="text-blue-600 hover:underline">
                                {task.projectName}
                              </a>
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          </div>
                        </div>
                      </CardHeader>
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
                    <p className="text-gray-500">У вас нет назначенных задач</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileDialogOpen} onOpenChange={setEditProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProfileFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Имя
                </label>
                <Input
                  id="name"
                  name="name"
                  value={profileFormData.name}
                  onChange={handleProfileFormChange}
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
                  value={profileFormData.email}
                  onChange={handleProfileFormChange}
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
                    value={profileFormData.position}
                    onChange={handleProfileFormChange}
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
                    value={profileFormData.department}
                    onChange={handleProfileFormChange}
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
                  value={profileFormData.phone}
                  onChange={handleProfileFormChange}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="bio" className="text-sm font-medium">
                  О себе
                </label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profileFormData.bio}
                  onChange={handleProfileFormChange}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditProfileDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialogOpen} onOpenChange={setChangePasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить пароль</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="currentPassword" className="text-sm font-medium">
                  Текущий пароль
                </label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordFormData.currentPassword}
                  onChange={handlePasswordFormChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  Новый пароль
                </label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordFormData.newPassword}
                  onChange={handlePasswordFormChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Подтвердите новый пароль
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={handlePasswordFormChange}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChangePasswordDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? "Изменение..." : "Изменить пароль"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
