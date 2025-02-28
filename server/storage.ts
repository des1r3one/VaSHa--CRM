import { 
  insertUserSchema, 
  type User, 
  type InsertUser, 
  type Workout, 
  type InsertWorkout,
  type Project,
  type InsertProject,
  type UpdateProject,
  type Task,
  type InsertTask,
  type UpdateTask,
  type CalendarEvent,
  type InsertCalendarEvent,
  type ProjectMember,
  type TaskComment
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Пользователи
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Тренировки
  createWorkout(userId: number, workout: InsertWorkout): Promise<Workout>;
  getWorkouts(userId: number): Promise<Workout[]>;
  
  // Проекты
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  updateProject(id: number, data: UpdateProject): Promise<Project>;
  getAllProjects(): Promise<Project[]>;
  getUserProjects(userId: number): Promise<Project[]>;
  
  // Участники проектов
  addProjectMember(projectId: number, userId: number, role?: string): Promise<ProjectMember>;
  getProjectMembers(projectId: number): Promise<User[]>;
  removeProjectMember(projectId: number, userId: number): Promise<void>;
  
  // Задачи
  createTask(creatorId: number, task: InsertTask): Promise<Task>;
  getTask(id: number): Promise<Task | undefined>;
  updateTask(id: number, data: UpdateTask): Promise<Task>;
  getProjectTasks(projectId: number): Promise<Task[]>;
  getUserTasks(userId: number): Promise<Task[]>;
  
  // Комментарии к задачам
  addTaskComment(taskId: number, userId: number, content: string): Promise<TaskComment>;
  getTaskComments(taskId: number): Promise<TaskComment[]>;
  
  // События календаря
  createCalendarEvent(userId: number, event: InsertCalendarEvent): Promise<CalendarEvent>;
  getUserCalendarEvents(userId: number): Promise<CalendarEvent[]>;
  updateCalendarEvent(id: number, data: Partial<CalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: number): Promise<void>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workouts: Map<number, Workout>;
  private projects: Map<number, Project>;
  private projectMembers: Map<number, ProjectMember>;
  private tasks: Map<number, Task>;
  private taskComments: Map<number, TaskComment>;
  private calendarEvents: Map<number, CalendarEvent>;
  
  sessionStore: session.Store;
  currentUserId: number;
  currentWorkoutId: number;
  currentProjectId: number;
  currentProjectMemberId: number;
  currentTaskId: number;
  currentTaskCommentId: number;
  currentCalendarEventId: number;

  constructor() {
    this.users = new Map();
    this.workouts = new Map();
    this.projects = new Map();
    this.projectMembers = new Map();
    this.tasks = new Map();
    this.taskComments = new Map();
    this.calendarEvents = new Map();
    
    this.currentUserId = 1;
    this.currentWorkoutId = 1;
    this.currentProjectId = 1;
    this.currentProjectMemberId = 1;
    this.currentTaskId = 1;
    this.currentTaskCommentId = 1;
    this.currentCalendarEventId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // Методы для работы с пользователями
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { id, ...insertUser };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Методы для работы с тренировками
  async createWorkout(userId: number, workout: InsertWorkout): Promise<Workout> {
    const id = this.currentWorkoutId++;
    const newWorkout: Workout = { id, userId, ...workout };
    this.workouts.set(id, newWorkout);
    return newWorkout;
  }

  async getWorkouts(userId: number): Promise<Workout[]> {
    return Array.from(this.workouts.values()).filter(
      (workout) => workout.userId === userId,
    );
  }
  
  // Методы для работы с проектами
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const now = new Date();
    const newProject: Project = { 
      id, 
      ...project, 
      createdAt: now, 
      updatedAt: now 
    };
    this.projects.set(id, newProject);
    return newProject;
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async updateProject(id: number, data: UpdateProject): Promise<Project> {
    const project = await this.getProject(id);
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }
    const updatedProject = { 
      ...project, 
      ...data, 
      updatedAt: new Date() 
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async getUserProjects(userId: number): Promise<Project[]> {
    const memberProjectIds = Array.from(this.projectMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.projectId);
    
    return Array.from(this.projects.values())
      .filter(project => memberProjectIds.includes(project.id));
  }
  
  // Методы для работы с участниками проектов
  async addProjectMember(projectId: number, userId: number, role: string = "member"): Promise<ProjectMember> {
    const id = this.currentProjectMemberId++;
    const member: ProjectMember = { id, projectId, userId, role };
    this.projectMembers.set(id, member);
    return member;
  }
  
  async getProjectMembers(projectId: number): Promise<User[]> {
    const memberIds = Array.from(this.projectMembers.values())
      .filter(member => member.projectId === projectId)
      .map(member => member.userId);
    
    return Array.from(this.users.values())
      .filter(user => memberIds.includes(user.id));
  }
  
  async removeProjectMember(projectId: number, userId: number): Promise<void> {
    const memberEntry = Array.from(this.projectMembers.entries())
      .find(([_, member]) => member.projectId === projectId && member.userId === userId);
    
    if (memberEntry) {
      this.projectMembers.delete(memberEntry[0]);
    }
  }
  
  // Методы для работы с задачами
  async createTask(creatorId: number, task: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const now = new Date();
    const newTask: Task = { 
      id, 
      creatorId, 
      ...task, 
      createdAt: now, 
      updatedAt: now 
    };
    this.tasks.set(id, newTask);
    return newTask;
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async updateTask(id: number, data: UpdateTask): Promise<Task> {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }
    const updatedTask = { 
      ...task, 
      ...data, 
      updatedAt: new Date() 
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async getProjectTasks(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.projectId === projectId);
  }
  
  async getUserTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.assigneeId === userId);
  }
  
  // Методы для работы с комментариями к задачам
  async addTaskComment(taskId: number, userId: number, content: string): Promise<TaskComment> {
    const id = this.currentTaskCommentId++;
    const now = new Date();
    const comment: TaskComment = { 
      id, 
      taskId, 
      userId, 
      content, 
      createdAt: now 
    };
    this.taskComments.set(id, comment);
    return comment;
  }
  
  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    return Array.from(this.taskComments.values())
      .filter(comment => comment.taskId === taskId);
  }
  
  // Методы для работы с событиями календаря
  async createCalendarEvent(userId: number, event: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = this.currentCalendarEventId++;
    const now = new Date();
    const newEvent: CalendarEvent = { 
      id, 
      userId, 
      ...event, 
      createdAt: now 
    };
    this.calendarEvents.set(id, newEvent);
    return newEvent;
  }
  
  async getUserCalendarEvents(userId: number): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values())
      .filter(event => event.userId === userId);
  }
  
  async updateCalendarEvent(id: number, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const event = this.calendarEvents.get(id);
    if (!event) {
      throw new Error(`Calendar event with id ${id} not found`);
    }
    const updatedEvent = { ...event, ...data };
    this.calendarEvents.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteCalendarEvent(id: number): Promise<void> {
    this.calendarEvents.delete(id);
  }
}

export const storage = new MemStorage();
