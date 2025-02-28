import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import './config/firebase'; // Импортируем конфигурацию Firebase

// Загрузка переменных окружения
dotenv.config();

// Создание экземпляра Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Маршруты API
app.use('/api', routes);

// Обработка ошибок
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Что-то пошло не так!' });
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
}); 