'use client';

import { useDraggable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Icon as TablerIcon } from '@/components/icons';

interface DraggableSidebarItemProps {
  type: string;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

export function DraggableSidebarItem({
  type,
  label,
  icon,
  className
}: DraggableSidebarItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-item-${type}`,
    data: {
      type,
      label,
      isSidebarItem: true
    }
  });

  return (
    <Button
      ref={setNodeRef}
      variant='outline'
      className={cn(
        'w-full cursor-grab justify-start active:cursor-grabbing',
        isDragging && 'opacity-50',
        className
      )}
      size='sm'
      {...listeners}
      {...attributes}
    >
      {icon}
      {label}
    </Button>
  );
}
