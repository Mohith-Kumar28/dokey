import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

interface DateFieldInputProps {
  value: string | null | undefined;
  onSave: (value: string) => void;
  width: number;
  height: number;
  className?: string;
}

export function DateFieldInput({
  value,
  onSave,
  width,
  height,
  className
}: DateFieldInputProps) {
  const [date, setDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );

  const handleSelectDate = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      const formattedDate = format(selectedDate, 'MM/dd/yyyy');
      onSave(formattedDate);
    }
  };

  return (
    <div
      className={cn('absolute inset-0', className)}
      style={{ width: `${width}px`, height: `${height}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className={cn(
              'h-full w-full justify-start text-left text-sm font-normal',
              'border-2 border-blue-500',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {date ? format(date, 'MM/dd/yyyy') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            selected={date}
            onSelect={handleSelectDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
