import { projectsCollection } from '../config/firebase';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export interface IProject {
  id?: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  createdBy: string;
  members: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const createProject = async (projectData: IProject): Promise<IProject> => {
  try {
    const projectDataWithTimestamps = {
      ...projectData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Преобразуем даты в Timestamp, если они есть
      startDate: projectData.startDate ? Timestamp.fromDate(new Date(projectData.startDate)) : null,
      endDate: projectData.endDate ? Timestamp.fromDate(new Date(projectData.endDate)) : null,
    };
    
    const projectRef = await projectsCollection.add(projectDataWithTimestamps);
    
    return {
      id: projectRef.id,
      ...projectData,
    };
  } catch (error) {
    console.error('Ошибка при создании проекта:', error);
    throw error;
  }
};

export const getProjectById = async (projectId: string): Promise<IProject | null> => {
  try {
    const projectDoc = await projectsCollection.doc(projectId).get();
    
    if (!projectDoc.exists) {
      return null;
    }
    
    const projectData = projectDoc.data() as Omit<IProject, 'id'>;
    
    // Преобразуем Timestamp обратно в Date
    return {
      id: projectDoc.id,
      ...projectData,
      startDate: projectData.startDate ? (projectData.startDate as unknown as Timestamp).toDate() : undefined,
      endDate: projectData.endDate ? (projectData.endDate as unknown as Timestamp).toDate() : undefined,
      createdAt: projectData.createdAt ? (projectData.createdAt as unknown as Timestamp).toDate() : undefined,
      updatedAt: projectData.updatedAt ? (projectData.updatedAt as unknown as Timestamp).toDate() : undefined,
    };
  } catch (error) {
    console.error('Ошибка при получении проекта по ID:', error);
    throw error;
  }
};

export const getProjectsByUserId = async (userId: string): Promise<IProject[]> => {
  try {
    const projectsSnapshot = await projectsCollection.where('members', 'array-contains', userId).get();
    
    return projectsSnapshot.docs.map(doc => {
      const data = doc.data() as Omit<IProject, 'id'>;
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate ? (data.startDate as unknown as Timestamp).toDate() : undefined,
        endDate: data.endDate ? (data.endDate as unknown as Timestamp).toDate() : undefined,
        createdAt: data.createdAt ? (data.createdAt as unknown as Timestamp).toDate() : undefined,
        updatedAt: data.updatedAt ? (data.updatedAt as unknown as Timestamp).toDate() : undefined,
      };
    });
  } catch (error) {
    console.error('Ошибка при получении проектов пользователя:', error);
    throw error;
  }
};

export const updateProject = async (projectId: string, projectData: Partial<IProject>): Promise<IProject> => {
  try {
    const updateData: any = {
      ...projectData,
      updatedAt: Timestamp.now(),
    };
    
    // Преобразуем даты в Timestamp, если они есть
    if (projectData.startDate) {
      updateData.startDate = Timestamp.fromDate(new Date(projectData.startDate));
    }
    
    if (projectData.endDate) {
      updateData.endDate = Timestamp.fromDate(new Date(projectData.endDate));
    }
    
    await projectsCollection.doc(projectId).update(updateData);
    
    const updatedProject = await getProjectById(projectId);
    
    if (!updatedProject) {
      throw new Error('Проект не найден после обновления');
    }
    
    return updatedProject;
  } catch (error) {
    console.error('Ошибка при обновлении проекта:', error);
    throw error;
  }
};

export const addProjectMember = async (projectId: string, userId: string): Promise<IProject> => {
  try {
    await projectsCollection.doc(projectId).update({
      members: FieldValue.arrayUnion(userId),
      updatedAt: Timestamp.now(),
    });
    
    const updatedProject = await getProjectById(projectId);
    
    if (!updatedProject) {
      throw new Error('Проект не найден после добавления участника');
    }
    
    return updatedProject;
  } catch (error) {
    console.error('Ошибка при добавлении участника проекта:', error);
    throw error;
  }
};

export const removeProjectMember = async (projectId: string, userId: string): Promise<IProject> => {
  try {
    await projectsCollection.doc(projectId).update({
      members: FieldValue.arrayRemove(userId),
      updatedAt: Timestamp.now(),
    });
    
    const updatedProject = await getProjectById(projectId);
    
    if (!updatedProject) {
      throw new Error('Проект не найден после удаления участника');
    }
    
    return updatedProject;
  } catch (error) {
    console.error('Ошибка при удалении участника проекта:', error);
    throw error;
  }
}; 