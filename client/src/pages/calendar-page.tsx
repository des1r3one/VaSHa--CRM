import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Calendar, Clock, MapPin } from "lucide-react";
import { format, parse, isToday, isSameDay, addDays } from "date-fns";
import { ru } from "date-fns/locale";

interface CalendarEvent {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  startDate: string;
  startTime: string | null;
  endDate: string | null;
  endTime: string | null;
  isAllDay: boolean;
  location: string | null;
  color: string | null;
  reminder: number | null;
  createdAt: string;
}

interface EventFormData {
  title: string;
  description: string;
  startDate: Date;
  startTime: string | null;
  endDate: Date | null;
  endTime: string | null;
  isAllDay: boolean;
  location: string;
  color: string;
}

const initialFormData: EventFormData = {
  title: "",
  description: "",
  startDate: new Date(),
  startTime: "09:00",
  endDate: new Date(),
  endTime: "10:00",
  isAllDay: false,
  location: "",
  color: "blue",
};

const colorOptions = [
  { value: "blue", label: "Синий", className: "bg-blue-500" },
  { value: "green", label: "Зеленый", className: "bg-green-500" },
  { value: "red", label: "Красный", className: "bg-red-500" },
  { value: "yellow", label: "Желтый", className: "bg-yellow-500" },
  { value: "purple", label: "Фиолетовый", className: "bg-purple-500" },
  { value: "pink", label: "Розовый", className: "bg-pink-500" },
  { value: "indigo", label: "Индиго", className: "bg-indigo-500" },
  { value: "gray", label: "Серый", className: "bg-gray-500" },
];

export default function CalendarPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["calendar-events"],
    queryFn: async () => {
      const response = await fetch("/api/calendar-events");
      if (!response.ok) {
        throw new Error("Failed to fetch calendar events");
      }
      return response.json();
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const response = await fetch("/api/calendar-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          startDate: format(data.startDate, "yyyy-MM-dd"),
          startTime: data.isAllDay ? null : data.startTime,
          endDate: data.endDate ? format(data.endDate, "yyyy-MM-dd") : null,
          endTime: data.isAllDay ? null : data.endTime,
          isAllDay: data.isAllDay,
          location: data.location || null,
          color: data.color,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      setIsDialogOpen(false);
      setFormData(initialFormData);
      toast({
        title: "Событие создано",
        description: "Новое событие успешно создано",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось создать событие: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({ ...prev, startDate: date }));
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, endDate: date }));
  };

  const handleIsAllDayChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isAllDay: checked }));
  };

  const handleColorChange = (value: string) => {
    setFormData((prev) => ({ ...prev, color: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate(formData);
  };

  const getEventsForDate = (date: Date) => {
    if (!events) return [];
    return events.filter((event) => {
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = event.endDate ? new Date(event.endDate) : null;
      
      if (isSameDay(date, eventStartDate)) {
        return true;
      }
      
      if (eventEndDate && date >= eventStartDate && date <= eventEndDate) {
        return true;
      }
      
      return false;
    });
  };

  const getColorClass = (color: string | null) => {
    switch (color) {
      case "blue":
        return "bg-blue-500";
      case "green":
        return "bg-green-500";
      case "red":
        return "bg-red-500";
      case "yellow":
        return "bg-yellow-500";
      case "purple":
        return "bg-purple-500";
      case "pink":
        return "bg-pink-500";
      case "indigo":
        return "bg-indigo-500";
      case "gray":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setFormData((prev) => ({ ...prev, startDate: date, endDate: date }));
    }
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Календарь</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Новое событие
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Создать новое событие</DialogTitle>
                <DialogDescription>
                  Заполните информацию о новом событии
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Название
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Описание
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="flex items-center space-x-2 col-span-4">
                    <Checkbox
                      id="isAllDay"
                      checked={formData.isAllDay}
                      onCheckedChange={handleIsAllDayChange}
                    />
                    <Label htmlFor="isAllDay">Весь день</Label>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Дата начала
                  </Label>
                  <div className="col-span-3">
                    <DatePicker
                      id="startDate"
                      selected={formData.startDate}
                      onSelect={handleStartDateChange}
                      locale={ru}
                    />
                  </div>
                </div>
                {!formData.isAllDay && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="startTime" className="text-right">
                      Время начала
                    </Label>
                    <div className="col-span-3">
                      <TimePicker
                        id="startTime"
                        value={formData.startTime || ""}
                        onChange={(value) =>
                          setFormData((prev) => ({ ...prev, startTime: value }))
                        }
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    Дата окончания
                  </Label>
                  <div className="col-span-3">
                    <DatePicker
                      id="endDate"
                      selected={formData.endDate}
                      onSelect={handleEndDateChange}
                      locale={ru}
                    />
                  </div>
                </div>
                {!formData.isAllDay && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="endTime" className="text-right">
                      Время окончания
                    </Label>
                    <div className="col-span-3">
                      <TimePicker
                        id="endTime"
                        value={formData.endTime || ""}
                        onChange={(value) =>
                          setFormData((prev) => ({ ...prev, endTime: value }))
                        }
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Место
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="color" className="text-right">
                    Цвет
                  </Label>
                  <Select
                    value={formData.color}
                    onValueChange={handleColorChange}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Выберите цвет" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 rounded-full mr-2 ${color.className}`}
                            ></div>
                            <span>{color.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createEventMutation.isPending}>
                  {createEventMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Создать событие
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={ru}
              className="rounded-md"
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedDate
                  ? isToday(selectedDate)
                    ? "Сегодня"
                    : format(selectedDate, "d MMMM yyyy", { locale: ru })
                  : "Выберите дату"}
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Добавить
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start">
                        <div
                          className={`w-4 h-4 rounded-full mt-1 mr-3 ${getColorClass(
                            event.color
                          )}`}
                        ></div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-medium text-lg">{event.title}</h3>
                            <div className="text-sm text-muted-foreground">
                              {event.isAllDay
                                ? "Весь день"
                                : `${event.startTime || ""} ${
                                    event.endTime ? `- ${event.endTime}` : ""
                                  }`}
                            </div>
                          </div>
                          {event.description && (
                            <p className="text-muted-foreground mt-1">
                              {event.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-2">
                            {event.location && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="mr-1 h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            {event.endDate && !isSameDay(new Date(event.startDate), new Date(event.endDate)) && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="mr-1 h-4 w-4" />
                                <span>
                                  До{" "}
                                  {format(new Date(event.endDate), "d MMM", {
                                    locale: ru,
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      На выбранную дату нет событий
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 