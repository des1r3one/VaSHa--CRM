import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { Navigation } from "@/components/ui/navigation";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import ProfilePage from "@/pages/profile-page";
import WorkoutsPage from "@/pages/workouts-page";
import ProjectsPage from "@/pages/projects-page";
import ProjectDetailsPage from "@/pages/project-details-page";
import TasksPage from "@/pages/tasks-page";
import TaskDetailsPage from "@/pages/task-details-page";
import CalendarPage from "@/pages/calendar-page";
import EmployeesPage from "@/pages/employees-page";
import EmployeeProfilePage from "@/pages/employee-profile-page";
import { useAuth } from "./hooks/use-auth";
import { Loader2 } from "lucide-react";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <div className="flex-1 pt-14 md:pt-16 md:pl-64">
        <main className="min-h-screen bg-gray-50 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <Route path="*" component={() => <AuthPage />} />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="*">
        {() => (
          <AppLayout>
            <Switch>
              <Route path="/">
                {() => (
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/profile">
                {() => (
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/workouts">
                {() => (
                  <ProtectedRoute>
                    <WorkoutsPage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/projects">
                {() => (
                  <ProtectedRoute>
                    <ProjectsPage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/projects/:id">
                {(params) => (
                  <ProtectedRoute>
                    <ProjectDetailsPage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/tasks">
                {() => (
                  <ProtectedRoute>
                    <TasksPage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/tasks/:id">
                {(params) => (
                  <ProtectedRoute>
                    <TaskDetailsPage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/calendar">
                {() => (
                  <ProtectedRoute>
                    <CalendarPage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/employees">
                {() => (
                  <ProtectedRoute>
                    <EmployeesPage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/employees/:id">
                {(params) => (
                  <ProtectedRoute>
                    <EmployeeProfilePage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route>
                {() => (
                  <ProtectedRoute>
                    <NotFound />
                  </ProtectedRoute>
                )}
              </Route>
            </Switch>
          </AppLayout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
