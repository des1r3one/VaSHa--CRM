import express from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { UserModel } from './models/user';
import { ProjectModel } from './models/project';
import { TaskModel } from './models/task';
import { CalendarEventModel } from './models/calendarEvent';
import { authenticateToken } from './middleware/auth';

// Импортируем сервисы для работы с Firebase
import * as userService from './services/userService';
import * as projectService from './services/projectService';
import * as taskService from './services/taskService';
import * as calendarEventService from './services/calendarEventService';

const router = express.Router();

// Схемы валидации
const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  position: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
});

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']).optional(),
});

const taskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  projectId: z.string().optional(),
  assignedTo: z.string().optional(),
});

const calendarEventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  allDay: z.boolean().optional(),
});

// Аутентификация
router.post('/auth/register', async (req, res) => {
  try {
    const validatedData = userSchema.parse(req.body);
    
    // Проверка, существует ли пользователь с таким email
    const existingUser = await userService.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }
    
    // Создание нового пользователя
    const newUser = await userService.createUser(validatedData);
    
    // Создание JWT токена
    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        position: newUser.position,
        department: newUser.department,
        phone: newUser.phone,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Ошибка валидации', errors: error.errors });
    }
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Проверка, существует ли пользователь с таким email
    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }
    
    // Проверка пароля
    // Примечание: в Firebase Authentication пароль хранится отдельно,
    // поэтому здесь мы используем Firebase Admin SDK для проверки
    try {
      // Создаем пользовательский токен Firebase
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );
      
      res.json({
        message: 'Успешная авторизация',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          position: user.position,
          department: user.department,
          phone: user.phone,
        },
      });
    } catch (error) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Проекты
router.post('/projects', authenticateToken, async (req, res) => {
  try {
    const validatedData = projectSchema.parse(req.body);
    
    const projectData = {
      ...validatedData,
      createdBy: req.user!.userId,
      members: [req.user!.userId],
      status: validatedData.status || 'not_started',
    };
    
    const newProject = await projectService.createProject(projectData);
    
    res.status(201).json({
      message: 'Проект успешно создан',
      project: newProject,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Ошибка валидации', errors: error.errors });
    }
    console.error('Ошибка при создании проекта:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await projectService.getProjectsByUserId(req.user!.userId);
    
    res.json(projects);
  } catch (error) {
    console.error('Ошибка при получении проектов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }
    
    // Проверка, является ли пользователь участником проекта
    if (!project.members.includes(req.user!.userId)) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Ошибка при получении проекта:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/projects/:id', authenticateToken, async (req, res) => {
  try {
    const validatedData = projectSchema.parse(req.body);
    
    const project = await projectService.getProjectById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }
    
    // Проверка, является ли пользователь создателем проекта
    if (project.createdBy !== req.user!.userId) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const updatedProject = await projectService.updateProject(req.params.id, validatedData);
    
    res.json({
      message: 'Проект успешно обновлен',
      project: updatedProject,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Ошибка валидации', errors: error.errors });
    }
    console.error('Ошибка при обновлении проекта:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/projects/:id/members', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'ID пользователя обязателен' });
    }
    
    const project = await projectService.getProjectById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }
    
    // Проверка, является ли пользователь создателем проекта
    if (project.createdBy !== req.user!.userId) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    // Проверка, существует ли пользователь
    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Проверка, не является ли пользователь уже участником проекта
    if (project.members.includes(userId)) {
      return res.status(400).json({ message: 'Пользователь уже является участником проекта' });
    }
    
    // Добавление пользователя в проект
    const updatedProject = await projectService.addProjectMember(req.params.id, userId);
    
    res.json({
      message: 'Пользователь успешно добавлен в проект',
      project: updatedProject,
    });
  } catch (error) {
    console.error('Ошибка при добавлении участника проекта:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Задачи
router.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const validatedData = taskSchema.parse(req.body);
    
    // Если задача привязана к проекту, проверяем, является ли пользователь участником проекта
    if (validatedData.projectId) {
      const project = await projectService.getProjectById(validatedData.projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Проект не найден' });
      }
      
      if (!project.members.includes(req.user!.userId)) {
        return res.status(403).json({ message: 'Доступ запрещен' });
      }
    }
    
    const taskData = {
      ...validatedData,
      createdBy: req.user!.userId,
      status: validatedData.status || 'todo',
      priority: validatedData.priority || 'medium',
      comments: [],
    };
    
    const newTask = await taskService.createTask(taskData);
    
    res.status(201).json({
      message: 'Задача успешно создана',
      task: newTask,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Ошибка валидации', errors: error.errors });
    }
    console.error('Ошибка при создании задачи:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.query;
    
    if (projectId) {
      // Проверяем, является ли пользователь участником проекта
      const project = await projectService.getProjectById(projectId as string);
      
      if (!project) {
        return res.status(404).json({ message: 'Проект не найден' });
      }
      
      if (!project.members.includes(req.user!.userId)) {
        return res.status(403).json({ message: 'Доступ запрещен' });
      }
      
      const tasks = await taskService.getTasksByProjectId(projectId as string);
      return res.json(tasks);
    } else {
      // Получаем задачи пользователя
      const tasks = await taskService.getTasksByUserId(req.user!.userId);
      return res.json(tasks);
    }
  } catch (error) {
    console.error('Ошибка при получении задач:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Задача не найдена' });
    }
    
    // Проверка, имеет ли пользователь доступ к задаче
    if (task.createdBy !== req.user!.userId && 
        task.assignedTo !== req.user!.userId) {
      
      // Если задача привязана к проекту, проверяем, является ли пользователь участником проекта
      if (task.projectId) {
        const project = await projectService.getProjectById(task.projectId);
        
        if (!project || !project.members.includes(req.user!.userId)) {
          return res.status(403).json({ message: 'Доступ запрещен' });
        }
      } else {
        return res.status(403).json({ message: 'Доступ запрещен' });
      }
    }
    
    res.json(task);
  } catch (error) {
    console.error('Ошибка при получении задачи:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const validatedData = taskSchema.parse(req.body);
    
    const task = await taskService.getTaskById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Задача не найдена' });
    }
    
    // Проверка, имеет ли пользователь доступ к задаче
    if (task.createdBy !== req.user!.userId && 
        task.assignedTo !== req.user!.userId) {
      
      // Если задача привязана к проекту, проверяем, является ли пользователь участником проекта
      if (task.projectId) {
        const project = await projectService.getProjectById(task.projectId);
        
        if (!project || !project.members.includes(req.user!.userId)) {
          return res.status(403).json({ message: 'Доступ запрещен' });
        }
      } else {
        return res.status(403).json({ message: 'Доступ запрещен' });
      }
    }
    
    const updatedTask = await taskService.updateTask(req.params.id, validatedData);
    
    res.json({
      message: 'Задача успешно обновлена',
      task: updatedTask,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Ошибка валидации', errors: error.errors });
    }
    console.error('Ошибка при обновлении задачи:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/tasks/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Текст комментария обязателен' });
    }
    
    const task = await taskService.getTaskById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Задача не найдена' });
    }
    
    // Проверка, имеет ли пользователь доступ к задаче
    let hasAccess = false;
    
    if (task.createdBy === req.user!.userId || 
        task.assignedTo === req.user!.userId) {
      hasAccess = true;
    } else if (task.projectId) {
      // Если задача привязана к проекту, проверяем, является ли пользователь участником проекта
      const project = await projectService.getProjectById(task.projectId);
      
      if (project && project.members.includes(req.user!.userId)) {
        hasAccess = true;
      }
    }
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    // Добавление комментария
    const commentData = {
      text,
      createdBy: req.user!.userId,
    };
    
    const updatedTask = await taskService.addTaskComment(req.params.id, commentData);
    
    res.json({
      message: 'Комментарий успешно добавлен',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Ошибка при добавлении комментария:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Календарь событий
router.post('/calendar-events', authenticateToken, async (req, res) => {
  try {
    const validatedData = calendarEventSchema.parse(req.body);
    
    const eventData = {
      ...validatedData,
      userId: req.user!.userId,
      allDay: validatedData.allDay || false,
    };
    
    const newEvent = await calendarEventService.createCalendarEvent(eventData);
    
    res.status(201).json({
      message: 'Событие успешно создано',
      event: newEvent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Ошибка валидации', errors: error.errors });
    }
    console.error('Ошибка при создании события:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/calendar-events', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const events = await calendarEventService.getCalendarEventsByUserId(
      req.user!.userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.json(events);
  } catch (error) {
    console.error('Ошибка при получении событий:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/calendar-events/:id', authenticateToken, async (req, res) => {
  try {
    const event = await calendarEventService.getCalendarEventById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }
    
    // Проверка, принадлежит ли событие пользователю
    if (event.userId !== req.user!.userId) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Ошибка при получении события:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.put('/calendar-events/:id', authenticateToken, async (req, res) => {
  try {
    const validatedData = calendarEventSchema.parse(req.body);
    
    const event = await calendarEventService.getCalendarEventById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }
    
    // Проверка, принадлежит ли событие пользователю
    if (event.userId !== req.user!.userId) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const updatedEvent = await calendarEventService.updateCalendarEvent(req.params.id, validatedData);
    
    res.json({
      message: 'Событие успешно обновлено',
      event: updatedEvent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Ошибка валидации', errors: error.errors });
    }
    console.error('Ошибка при обновлении события:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.delete('/calendar-events/:id', authenticateToken, async (req, res) => {
  try {
    const event = await calendarEventService.getCalendarEventById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Событие не найдено' });
    }
    
    // Проверка, принадлежит ли событие пользователю
    if (event.userId !== req.user!.userId) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    await calendarEventService.deleteCalendarEvent(req.params.id);
    
    res.json({
      message: 'Событие успешно удалено',
    });
  } catch (error) {
    console.error('Ошибка при удалении события:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Пользователи
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    
    // Удаляем пароли из ответа
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Удаляем пароль из ответа
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await userService.getUserById(req.user!.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Удаляем пароль из ответа
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Ошибка при получении профиля пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router; 