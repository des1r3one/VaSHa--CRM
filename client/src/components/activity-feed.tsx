import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Link } from "wouter";
import { Avatar } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type ActivityType = 
  | "task_created" 
  | "task_completed" 
  | "task_assigned" 
  | "project_created" 
  | "project_updated" 
  | "comment_added" 
  | "member_added";

interface Activity {
  id: string;
  type: ActivityType;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  data: {
    taskId?: string;
    taskTitle?: string;
    projectId?: string;
    projectName?: string;
    commentId?: string;
    commentText?: string;
    assigneeId?: string;
    assigneeName?: string;
  };
}

interface ActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  isLoading = false,
  emptyMessage = "Нет активностей для отображения",
  className = "",
}) => {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Последние активности</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-3 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-gray-200"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Последние активности</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">{emptyMessage}</div>
        </CardContent>
      </Card>
    );
  }

  const getActivityText = (activity: Activity): { text: string; link?: string } => {
    const { type, data } = activity;

    switch (type) {
      case "task_created":
        return {
          text: `создал(а) задачу "${data.taskTitle}"`,
          link: `/tasks/${data.taskId}`,
        };
      case "task_completed":
        return {
          text: `завершил(а) задачу "${data.taskTitle}"`,
          link: `/tasks/${data.taskId}`,
        };
      case "task_assigned":
        return {
          text: `назначил(а) задачу "${data.taskTitle}" пользователю ${data.assigneeName}`,
          link: `/tasks/${data.taskId}`,
        };
      case "project_created":
        return {
          text: `создал(а) проект "${data.projectName}"`,
          link: `/projects/${data.projectId}`,
        };
      case "project_updated":
        return {
          text: `обновил(а) проект "${data.projectName}"`,
          link: `/projects/${data.projectId}`,
        };
      case "comment_added":
        return {
          text: `добавил(а) комментарий к задаче "${data.taskTitle}"`,
          link: `/tasks/${data.taskId}`,
        };
      case "member_added":
        return {
          text: `добавил(а) ${data.assigneeName} в проект "${data.projectName}"`,
          link: `/projects/${data.projectId}`,
        };
      default:
        return { text: "выполнил(а) действие" };
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Последние активности</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => {
          const { text, link } = getActivityText(activity);
          const timeAgo = formatDistanceToNow(
            new Date(activity.createdAt),
            { addSuffix: true, locale: ru }
          );

          return (
            <div key={activity.id} className="flex space-x-3">
              <Avatar
                src={activity.user.avatar}
                name={activity.user.name}
                size="md"
              />
              <div>
                <div className="text-sm">
                  <Link href={`/employees/${activity.user.id}`}>
                    <a className="font-medium text-gray-900">
                      {activity.user.name}
                    </a>
                  </Link>{" "}
                  {link ? (
                    <Link href={link}>
                      <a className="text-gray-700">{text}</a>
                    </Link>
                  ) : (
                    <span className="text-gray-700">{text}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">{timeAgo}</div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export { ActivityFeed, type Activity, type ActivityType }; 