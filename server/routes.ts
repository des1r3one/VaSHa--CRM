import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  updateProfileSchema, 
  insertWorkoutSchema,
  insertProjectSchema,
  updateProjectSchema,
  insertTaskSchema,
  updateTaskSchema,
  insertCalendarEventSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/me", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });

  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const user = await storage.createUser(userData);
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed" });
        }
        return res.json(user);
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.put("/api/profile", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const profileData = updateProfileSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.user.id, profileData);
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  
  app.get("/api/users", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/workouts", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const workoutData = insertWorkoutSchema.parse(req.body);
      const workout = await storage.createWorkout(req.user.id, workoutData);
      res.json(workout);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.get("/api/workouts", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const workouts = await storage.getWorkouts(req.user.id);
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workouts" });
    }
  });
  
  app.post("/api/projects", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      await storage.addProjectMember(project.id, req.user.id, "owner");
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  
  app.get("/api/projects", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const projects = await storage.getUserProjects(req.user.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });
  
  app.get("/api/projects/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });
  
  app.put("/api/projects/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const projectId = parseInt(req.params.id);
      const projectData = updateProjectSchema.parse(req.body);
      const updatedProject = await storage.updateProject(projectId, projectData);
      res.json(updatedProject);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  
  app.post("/api/projects/:id/members", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const projectId = parseInt(req.params.id);
      const { userId, role } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      const member = await storage.addProjectMember(projectId, userId, role);
      res.json(member);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  
  app.get("/api/projects/:id/members", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const projectId = parseInt(req.params.id);
      const members = await storage.getProjectMembers(projectId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project members" });
    }
  });
  
  app.delete("/api/projects/:projectId/members/:userId", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = parseInt(req.params.userId);
      await storage.removeProjectMember(projectId, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove project member" });
    }
  });
  
  app.post("/api/tasks", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(req.user.id, taskData);
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  
  app.get("/api/tasks", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const tasks = await storage.getUserTasks(req.user.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });
  
  app.get("/api/projects/:id/tasks", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const projectId = parseInt(req.params.id);
      const tasks = await storage.getProjectTasks(projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project tasks" });
    }
  });
  
  app.get("/api/tasks/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });
  
  app.put("/api/tasks/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const taskId = parseInt(req.params.id);
      const taskData = updateTaskSchema.parse(req.body);
      const updatedTask = await storage.updateTask(taskId, taskData);
      res.json(updatedTask);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  
  app.post("/api/tasks/:id/comments", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const taskId = parseInt(req.params.id);
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }
      const comment = await storage.addTaskComment(taskId, req.user.id, content);
      res.json(comment);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  
  app.get("/api/tasks/:id/comments", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const taskId = parseInt(req.params.id);
      const comments = await storage.getTaskComments(taskId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task comments" });
    }
  });
  
  app.post("/api/calendar-events", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const eventData = insertCalendarEventSchema.parse(req.body);
      const event = await storage.createCalendarEvent(req.user.id, eventData);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  
  app.get("/api/calendar-events", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const events = await storage.getUserCalendarEvents(req.user.id);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });
  
  app.put("/api/calendar-events/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const eventId = parseInt(req.params.id);
      const eventData = req.body;
      const updatedEvent = await storage.updateCalendarEvent(eventId, eventData);
      res.json(updatedEvent);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  
  app.delete("/api/calendar-events/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const eventId = parseInt(req.params.id);
      await storage.deleteCalendarEvent(eventId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete calendar event" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
