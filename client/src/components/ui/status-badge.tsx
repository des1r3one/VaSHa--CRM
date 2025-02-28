import * as React from "react";

type StatusType = "pending" | "in-progress" | "completed" | "cancelled";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const statusConfig = {
    pending: {
      label: "Ожидает",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
    },
    "in-progress": {
      label: "В процессе",
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
    },
    completed: {
      label: "Завершено",
      bgColor: "bg-green-100",
      textColor: "text-green-800",
    },
    cancelled: {
      label: "Отменено",
      bgColor: "bg-red-100",
      textColor: "text-red-800",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      {config.label}
    </span>
  );
};

export { StatusBadge, type StatusType }; 