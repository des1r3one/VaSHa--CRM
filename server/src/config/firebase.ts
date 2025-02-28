import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Инициализация Firebase Admin SDK
// В продакшене используйте переменные окружения или файл сервисного аккаунта
if (!admin.apps.length) {
  // Если у вас есть файл сервисного аккаунта
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Заменяем переносы строк в приватном ключе
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      } as admin.ServiceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    console.log('Firebase Admin SDK инициализирован');
  } catch (error) {
    console.error('Ошибка инициализации Firebase Admin SDK:', error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();

// Коллекции Firestore
export const usersCollection = db.collection('users');
export const projectsCollection = db.collection('projects');
export const tasksCollection = db.collection('tasks');
export const calendarEventsCollection = db.collection('calendarEvents');

export default admin; 