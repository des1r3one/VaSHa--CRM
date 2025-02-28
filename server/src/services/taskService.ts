import { tasksCollection } from '../config/firebase';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export interface IComment {
  id?: string;
  text: string;
  createdBy: string;
  createdAt: Date;
}

export interface ITask {
  id?: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  projectId?: string;
  createdBy: string;
  assignedTo?: string;
  comments: IComment[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const createTask = async (taskData: ITask): Promise<ITask> => {
  try {
    const taskDataWithTimestamps = {
      ...taskData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Преобразуем даты в Timestamp, если они есть
      dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : null,
      // Инициализируем комментарии пустым массивом, если их нет
      comments: taskData.comments || [],
    };
    
    const taskRef = await tasksCollection.add(taskDataWithTimestamps);
    
    return {
      id: taskRef.id,
      ...taskData,
    };
  } catch (error) {
    console.error('Ошибка при создании задачи:', error);
    throw error;
  }
};

export const getTaskById = async (taskId: string): Promise<ITask | null> => {
  try {
    const taskDoc = await tasksCollection.doc(taskId).get();
    
    if (!taskDoc.exists) {
      return null;
    }
    
    const taskData = taskDoc.data() as Omit<ITask, 'id'>;
    
    // Преобразуем Timestamp обратно в Date
    return {
      id: taskDoc.id,
      ...taskData,
      dueDate: taskData.dueDate ? (taskData.dueDate as unknown as Timestamp).toDate() : undefined,
      createdAt: taskData.createdAt ? (taskData.createdAt as unknown as Timestamp).toDate() : undefined,
      updatedAt: taskData.updatedAt ? (taskData.updatedAt as unknown as Timestamp).toDate() : undefined,
      comments: taskData.comments ? taskData.comments.map((comment: any) => ({
        ...comment,
        createdAt: comment.createdAt ? (comment.createdAt as unknown as Timestamp).toDate() : new Date(),
      })) : [],
    };
  } catch (error) {
    console.error('Ошибка при получении задачи по ID:', error);
    throw error;
  }
};

export const getTasksByUserId = async (userId: string): Promise<ITask[]> => {
  try {
    // Получаем задачи, созданные пользователем или назначенные ему
    const createdBySnapshot = await tasksCollection.where('createdBy', '==', userId).get();
    const assignedToSnapshot = await tasksCollection.where('assignedTo', '==', userId).get();
    
    // Объединяем результаты и удаляем дубликаты
    const taskDocs = [...createdBySnapshot.docs, ...assignedToSnapshot.docs];
    const uniqueTasks = new Map();
    
    taskDocs.forEach(doc => {
      if (!uniqueTasks.has(doc.id)) {
        uniqueTasks.set(doc.id, doc);
      }
    });
    
    // Преобразуем данные
    return Array.from(uniqueTasks.values()).map(doc => {
      const data = doc.data() as Omit<ITask, 'id'>;
      return {
        id: doc.id,
        ...data,
        dueDate: data.dueDate ? (data.dueDate as unknown as Timestamp).toDate() : undefined,
        createdAt: data.createdAt ? (data.createdAt as unknown as Timestamp).toDate() : undefined,
        updatedAt: data.updatedAt ? (data.updatedAt as unknown as Timestamp).toDate() : undefined,
        comments: data.comments ? data.comments.map((comment: any) => ({
          ...comment,
          createdAt: comment.createdAt ? (comment.createdAt as unknown as Timestamp).toDate() : new Date(),
        })) : [],
      };
    });
  } catch (error) {
    console.error('Ошибка при получении задач пользователя:', error);
    throw error;
  }
};

export const getTasksByProjectId = async (projectId: string): Promise<ITask[]> => {
  try {
    const tasksSnapshot = await tasksCollection.where('projectId', '==', projectId).get();
    
    return tasksSnapshot.docs.map(doc => {
      const data = doc.data() as Omit<ITask, 'id'>;
      return {
        id: doc.id,
        ...data,
        dueDate: data.dueDate ? (data.dueDate as unknown as Timestamp).toDate() : undefined,
        createdAt: data.createdAt ? (data.createdAt as unknown as Timestamp).toDate() : undefined,
        updatedAt: data.updatedAt ? (data.updatedAt as unknown as Timestamp).toDate() : undefined,
        comments: data.comments ? data.comments.map((comment: any) => ({
          ...comment,
          createdAt: comment.createdAt ? (comment.createdAt as unknown as Timestamp).toDate() : new Date(),
        })) : [],
      };
    });
  } catch (error) {
    console.error('Ошибка при получении задач проекта:', error);
    throw error;
  }
};

export const updateTask = async (taskId: string, taskData: Partial<ITask>): Promise<ITask> => {
  try {
    const updateData: any = {
      ...taskData,
      updatedAt: Timestamp.now(),
    };
    
    // Преобразуем даты в Timestamp, если они есть
    if (taskData.dueDate) {
      updateData.dueDate = Timestamp.fromDate(new Date(taskData.dueDate));
    }
    
    await tasksCollection.doc(taskId).update(updateData);
    
    const updatedTask = await getTaskById(taskId);
    
    if (!updatedTask) {
      throw new Error('Задача не найдена после обновления');
    }
    
    return updatedTask;
  } catch (error) {
    console.error('Ошибка при обновлении задачи:', error);
    throw error;
  }
};

export const addTaskComment = async (taskId: string, commentData: Omit<IComment, 'id' | 'createdAt'>): Promise<ITask> => {
  try {
    const comment = {
      ...commentData,
      createdAt: Timestamp.now(),
      id: Math.random().toString(36).substring(2, 15),
    };
    
    await tasksCollection.doc(taskId).update({
      comments: FieldValue.arrayUnion(comment),
      updatedAt: Timestamp.now(),
    });
    
    const updatedTask = await getTaskById(taskId);
    
    if (!updatedTask) {
      throw new Error('Задача не найдена после добавления комментария');
    }
    
    return updatedTask;
  } catch (error) {
    console.error('Ошибка при добавлении комментария к задаче:', error);
    throw error;
  }
}; 