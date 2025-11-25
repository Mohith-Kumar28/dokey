import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TextFieldInputProps {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  placeholder?: string;
  width: number;
  height: number;
  className?: string;
}

export function TextFieldInput({
  value: initialValue,
  onSave,
  onCancel,
  placeholder = 'Enter text...',
  width,
  height,
  className
}: TextFieldInputProps) {
  const [value, setValue] = useState(initialValue || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = () => {
    onSave(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type='text'
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={cn(
        'absolute inset-0 h-full w-full px-2 py-1 text-sm',
        'rounded border-2 border-blue-500',
        'focus:ring-2 focus:ring-blue-500 focus:outline-none',
        'bg-white',
        className
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`
      }}
    />
  );
}
