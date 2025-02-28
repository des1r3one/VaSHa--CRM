import * as React from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Card, CardContent } from "./ui/card";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string | Date;
  startTime: string;
  endTime: string;
  location?: string;
  participants?: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
}

interface EventListProps {
  events: CalendarEvent[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  onEventClick?: (event: CalendarEvent) => void;
}

const EventList: React.FC<EventListProps> = ({
  events,
  isLoading = false,
  emptyMessage = "Нет событий для отображения",
  className = "",
  onEventClick,
}) => {
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-16"></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  // Сортировка событий по времени начала
  const sortedEvents = [...events].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className={`space-y-2 ${className}`}>
      {sortedEvents.map((event) => (
        <Card
          key={event.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onEventClick && onEventClick(event)}
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-gray-900">
                  {event.title}
                </h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <span className="mr-2">
                    {event.startTime} - {event.endTime}
                  </span>
                  {event.location && (
                    <span className="text-gray-500">| {event.location}</span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {event.participants && (
                  <span>{event.participants.length} участников</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export { EventList, type CalendarEvent }; 