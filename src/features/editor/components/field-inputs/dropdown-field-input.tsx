import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DropdownFieldInputProps {
  value: string | null | undefined;
  onSave: (value: string) => void;
  options?: string[];
  placeholder?: string;
  width: number;
  height: number;
  className?: string;
}

export function DropdownFieldInput({
  value,
  onSave,
  options = [],
  placeholder = 'Select an option',
  width,
  height,
  className
}: DropdownFieldInputProps) {
  return (
    <div
      className={cn('absolute inset-0', className)}
      style={{ width: `${width}px`, height: `${height}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <Select value={value || undefined} onValueChange={(val) => onSave(val)}>
        <SelectTrigger className='h-full w-full border-2 border-blue-500 text-sm'>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.length > 0 ? (
            options.map((option, index) => (
              <SelectItem key={index} value={option}>
                {option}
              </SelectItem>
            ))
          ) : (
            <SelectItem value='no-options' disabled>
              No options configured
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
