import * as React from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover } from "./popover";

interface DatePickerProps {
  id?: string;
  selected: Date | null;
  onSelect: (date: Date | null) => void;
  locale?: Locale;
  placeholder?: string;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  id,
  selected,
  onSelect,
  locale = ru,
  placeholder = "Выберите дату",
  className = "",
}) => {
  return (
    <Popover>
      <Popover.Trigger asChild>
        <Button
          id={id}
          variant="outline"
          className={`w-full justify-start text-left font-normal ${className}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? (
            format(selected, "PPP", { locale })
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </Popover.Trigger>
      <Popover.Content className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          locale={locale}
          initialFocus
        />
      </Popover.Content>
    </Popover>
  );
}; 