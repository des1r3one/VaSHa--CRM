import { usersCollection, auth } from '../config/firebase';
import bcrypt from 'bcrypt';

export interface IUser {
  id?: string;
  name: string;
  email: string;
  password?: string;
  position?: string;
  department?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createUser = async (userData: IUser): Promise<IUser> => {
  try {
    // Хеширование пароля
    const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : undefined;
    
    // Создание пользователя в Firebase Authentication
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.name,
    });
    
    // Подготовка данных для Firestore (без пароля)
    const userDataForFirestore: Omit<IUser, 'password'> = {
      name: userData.name,
      email: userData.email,
      position: userData.position,
      department: userData.department,
      phone: userData.phone,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Сохранение дополнительных данных в Firestore
    await usersCollection.doc(userRecord.uid).set(userDataForFirestore);
    
    // Возвращаем данные пользователя без пароля
    return {
      id: userRecord.uid,
      ...userDataForFirestore,
    };
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string): Promise<IUser | null> => {
  try {
    const usersSnapshot = await usersCollection.where('email', '==', email).limit(1).get();
    
    if (usersSnapshot.empty) {
      return null;
    }
    
    const userDoc = usersSnapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data() as Omit<IUser, 'id'>,
    };
  } catch (error) {
    console.error('Ошибка при получении пользователя по email:', error);
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<IUser | null> => {
  try {
    const userDoc = await usersCollection.doc(userId).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    return {
      id: userDoc.id,
      ...userDoc.data() as Omit<IUser, 'id'>,
    };
  } catch (error) {
    console.error('Ошибка при получении пользователя по ID:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<IUser[]> => {
  try {
    const usersSnapshot = await usersCollection.get();
    
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<IUser, 'id'>,
    }));
  } catch (error) {
    console.error('Ошибка при получении всех пользователей:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, userData: Partial<IUser>): Promise<IUser> => {
  try {
    // Обновляем данные в Firestore
    const updateData = {
      ...userData,
      updatedAt: new Date(),
    };
    
    // Удаляем пароль из данных для Firestore
    if ('password' in updateData) {
      delete updateData.password;
    }
    
    await usersCollection.doc(userId).update(updateData);
    
    // Если есть пароль, обновляем его в Firebase Authentication
    if (userData.password) {
      await auth.updateUser(userId, {
        password: userData.password,
      });
    }
    
    // Получаем обновленные данные пользователя
    const updatedUser = await getUserById(userId);
    
    if (!updatedUser) {
      throw new Error('Пользователь не найден после обновления');
    }
    
    return updatedUser;
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    throw error;
  }
}; 