import { pgTable, text, serial, integer, boolean, timestamp, date, time, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  phone: text("phone"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  position: text("position"),
  department: text("department"),
  avatar: text("avatar"),
  height: integer("height"),
  weight: integer("weight"),
  chest: integer("chest"),
  waist: integer("waist"),
  hips: integer("hips"),
  biceps: integer("biceps"),
  thighs: integer("thighs"),
  isAdmin: boolean("is_admin").default(false),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectMembers = pgTable("project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").default("member"),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("todo"),
  priority: text("priority").default("medium"),
  projectId: integer("project_id"),
  assigneeId: integer("assignee_id"),
  creatorId: integer("creator_id").notNull(),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taskComments = pgTable("task_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  startTime: time("start_time"),
  endDate: date("end_date"),
  endTime: time("end_time"),
  isAllDay: boolean("is_all_day").default(false),
  location: text("location"),
  color: text("color"),
  reminder: integer("reminder"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  type: text("type").notNull(),
  duration: integer("duration").notNull(),
  notes: text("notes"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  position: true,
  department: true,
});

export const updateProfileSchema = createInsertSchema(users)
  .omit({ id: true, password: true, isAdmin: true })
  .partial();

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
  userId: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProjectSchema = createInsertSchema(projects)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  creatorId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTaskSchema = createInsertSchema(tasks)
  .omit({ id: true, creatorId: true, createdAt: true, updatedAt: true })
  .partial();

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type User = typeof users.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type TaskComment = typeof taskComments.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
