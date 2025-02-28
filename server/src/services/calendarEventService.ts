import { calendarEventsCollection } from '../config/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export interface ICalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createCalendarEvent = async (eventData: ICalendarEvent): Promise<ICalendarEvent> => {
  try {
    const eventDataWithTimestamps = {
      ...eventData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Преобразуем даты в Timestamp
      startDate: Timestamp.fromDate(new Date(eventData.startDate)),
      endDate: eventData.endDate ? Timestamp.fromDate(new Date(eventData.endDate)) : null,
    };
    
    const eventRef = await calendarEventsCollection.add(eventDataWithTimestamps);
    
    return {
      id: eventRef.id,
      ...eventData,
    };
  } catch (error) {
    console.error('Ошибка при создании события:', error);
    throw error;
  }
};

export const getCalendarEventById = async (eventId: string): Promise<ICalendarEvent | null> => {
  try {
    const eventDoc = await calendarEventsCollection.doc(eventId).get();
    
    if (!eventDoc.exists) {
      return null;
    }
    
    const eventData = eventDoc.data() as Omit<ICalendarEvent, 'id'>;
    
    // Преобразуем Timestamp обратно в Date
    return {
      id: eventDoc.id,
      ...eventData,
      startDate: (eventData.startDate as unknown as Timestamp).toDate(),
      endDate: eventData.endDate ? (eventData.endDate as unknown as Timestamp).toDate() : undefined,
      createdAt: eventData.createdAt ? (eventData.createdAt as unknown as Timestamp).toDate() : undefined,
      updatedAt: eventData.updatedAt ? (eventData.updatedAt as unknown as Timestamp).toDate() : undefined,
    };
  } catch (error) {
    console.error('Ошибка при получении события по ID:', error);
    throw error;
  }
};

export const getCalendarEventsByUserId = async (
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ICalendarEvent[]> => {
  try {
    let query = calendarEventsCollection.where('userId', '==', userId);
    
    // Если указаны даты, добавляем фильтрацию
    if (startDate && endDate) {
      query = query
        .where('startDate', '>=', Timestamp.fromDate(startDate))
        .where('endDate', '<=', Timestamp.fromDate(endDate));
    } else if (startDate) {
      query = query.where('startDate', '>=', Timestamp.fromDate(startDate));
    } else if (endDate) {
      query = query.where('endDate', '<=', Timestamp.fromDate(endDate));
    }
    
    const eventsSnapshot = await query.get();
    
    return eventsSnapshot.docs.map(doc => {
      const data = doc.data() as Omit<ICalendarEvent, 'id'>;
      return {
        id: doc.id,
        ...data,
        startDate: (data.startDate as unknown as Timestamp).toDate(),
        endDate: data.endDate ? (data.endDate as unknown as Timestamp).toDate() : undefined,
        createdAt: data.createdAt ? (data.createdAt as unknown as Timestamp).toDate() : undefined,
        updatedAt: data.updatedAt ? (data.updatedAt as unknown as Timestamp).toDate() : undefined,
      };
    });
  } catch (error) {
    console.error('Ошибка при получении событий пользователя:', error);
    throw error;
  }
};

export const updateCalendarEvent = async (
  eventId: string,
  eventData: Partial<ICalendarEvent>
): Promise<ICalendarEvent> => {
  try {
    const updateData: any = {
      ...eventData,
      updatedAt: Timestamp.now(),
    };
    
    // Преобразуем даты в Timestamp, если они есть
    if (eventData.startDate) {
      updateData.startDate = Timestamp.fromDate(new Date(eventData.startDate));
    }
    
    if (eventData.endDate) {
      updateData.endDate = Timestamp.fromDate(new Date(eventData.endDate));
    }
    
    await calendarEventsCollection.doc(eventId).update(updateData);
    
    const updatedEvent = await getCalendarEventById(eventId);
    
    if (!updatedEvent) {
      throw new Error('Событие не найдено после обновления');
    }
    
    return updatedEvent;
  } catch (error) {
    console.error('Ошибка при обновлении события:', error);
    throw error;
  }
};

export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  try {
    await calendarEventsCollection.doc(eventId).delete();
  } catch (error) {
    console.error('Ошибка при удалении события:', error);
    throw error;
  }
}; 