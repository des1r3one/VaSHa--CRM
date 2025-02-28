import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import jwt from 'jsonwebtoken';

// Расширение типа Request для добавления пользовательских свойств
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email?: string;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  try {
    // Проверяем JWT токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { userId: string };
    
    // Проверяем, существует ли пользователь в Firebase
    try {
      await auth.getUser(decoded.userId);
      req.user = { userId: decoded.userId };
      next();
    } catch (firebaseError) {
      return res.status(403).json({ message: 'Пользователь не найден или деактивирован' });
    }
  } catch (error) {
    return res.status(403).json({ message: 'Недействительный токен' });
  }
}; 