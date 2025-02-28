import * as React from "react";

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

type ToastActionType = "ADD_TOAST" | "UPDATE_TOAST" | "DISMISS_TOAST" | "REMOVE_TOAST";

type Action = 
  | { type: "ADD_TOAST"; toast: ToastProps }
  | { type: "UPDATE_TOAST"; toast: Partial<ToastProps> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId: string }
  | { type: "REMOVE_TOAST"; toastId: string };

interface State {
  toasts: ToastProps[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastTimeouts.has(toastId)) {
        clearTimeout(toastTimeouts.get(toastId));
        toastTimeouts.delete(toastId);
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId ? { ...t, dismissed: true } : t
        ),
      };
    }

    case "REMOVE_TOAST":
      if (toastTimeouts.has(action.toastId)) {
        clearTimeout(toastTimeouts.get(action.toastId));
        toastTimeouts.delete(action.toastId);
      }

      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    default:
      return state;
  }
};

const TOAST_REMOVE_DELAY = 1000;

const useToastProvider = () => {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] });

  const toast = React.useCallback(
    ({ ...props }: Omit<ToastProps, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      
      dispatch({ type: "ADD_TOAST", toast: { id, ...props } });
      
      return id;
    },
    [dispatch]
  );

  const update = React.useCallback(
    (props: Partial<ToastProps> & { id: string }) => {
      dispatch({ type: "UPDATE_TOAST", toast: props });
    },
    [dispatch]
  );

  const dismiss = React.useCallback(
    (toastId: string) => {
      dispatch({ type: "DISMISS_TOAST", toastId });

      setTimeout(() => {
        dispatch({ type: "REMOVE_TOAST", toastId });
      }, TOAST_REMOVE_DELAY);
    },
    [dispatch]
  );

  React.useEffect(() => {
    const timeouts = state.toasts.map((toast) => {
      if (toastTimeouts.has(toast.id)) return null;

      const timeout = setTimeout(() => {
        dismiss(toast.id);
      }, 5000);

      toastTimeouts.set(toast.id, timeout);
      return timeout;
    });

    return () => {
      timeouts.forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [state.toasts, dismiss]);

  return { toasts: state.toasts, toast, dismiss, update };
};

type ToastContextType = ReturnType<typeof useToastProvider>;
const ToastContext = React.createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useToastProvider();

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}; 