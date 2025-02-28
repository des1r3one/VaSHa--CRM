import * as React from "react";
import { useToast } from "./use-toast";
import type { ToastProps } from "./use-toast";

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  variant = "default",
}) => {
  const { dismiss } = useToast();

  return (
    <div
      className={`max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 ${
        variant === "destructive"
          ? "bg-red-50 text-red-800 ring-red-500"
          : "bg-white text-gray-900 ring-gray-200"
      }`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="ml-3 flex-1">
            {title && <p className="text-sm font-medium">{title}</p>}
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={() => dismiss(id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

const Toaster: React.FC = () => {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-0 right-0 p-4 w-full md:max-w-sm z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};

export { Toaster }; 