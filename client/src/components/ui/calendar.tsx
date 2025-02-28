import * as React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events?: Array<{
    id: string;
    date: Date | string;
    title: string;
  }>;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  events = [],
  className = "",
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(
    startOfMonth(selectedDate)
  );

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventDate =
        typeof event.date === "string" ? new Date(event.date) : event.date;
      return isSameDay(eventDate, day);
    });
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, "LLLL yyyy", { locale: ru })}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            &lt;
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}

        {Array.from({ length: new Date(currentMonth).getDay() === 0 ? 6 : new Date(currentMonth).getDay() - 1 }).map((_, index) => (
          <div key={`empty-${index}`} className="h-12 border border-transparent" />
        ))}

        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={day.toString()}
              onClick={() => onDateSelect(day)}
              className={`h-12 flex flex-col items-center justify-center border rounded-md ${
                isSelected
                  ? "bg-blue-100 border-blue-500"
                  : isToday
                  ? "border-gray-300 bg-gray-50"
                  : "border-transparent hover:bg-gray-50"
              } ${!isCurrentMonth && "opacity-50"}`}
            >
              <span
                className={`text-sm ${
                  isSelected
                    ? "font-medium text-blue-700"
                    : isToday
                    ? "font-medium text-gray-900"
                    : "text-gray-700"
                }`}
              >
                {format(day, "d")}
              </span>
              {dayEvents.length > 0 && (
                <div className="mt-1 h-1 w-1 rounded-full bg-blue-500"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { Calendar }; 