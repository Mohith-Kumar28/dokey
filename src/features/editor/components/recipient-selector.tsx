'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useEditorStore } from '../store/use-editor-store';

interface RecipientSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function RecipientSelector({
  value,
  onValueChange
}: RecipientSelectorProps) {
  const recipients = useEditorStore((state) => state.recipients) || [];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className='h-9 text-sm'>
        <SelectValue placeholder='All recipients' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='all'>All recipients</SelectItem>
        {recipients.map((recipient) => (
          <SelectItem key={recipient.id} value={recipient.id}>
            <div className='flex items-center gap-2'>
              <div
                className='h-2 w-2 rounded-full'
                style={{ backgroundColor: recipient.color }}
              />
              <span>{recipient.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
