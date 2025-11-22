'use client';

import { useDraggable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Icons } from '@/components/icons';

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
    <div
      ref={setNodeRef}
      className={cn(
        'group relative w-full cursor-grab transition-all duration-200',
        'border-border/50 bg-card/50 rounded-lg border backdrop-blur-sm',
        'hover:border-primary/50 hover:bg-card hover:shadow-primary/5 hover:shadow-md',
        'active:scale-[0.98] active:cursor-grabbing',
        isDragging && 'scale-95 opacity-40',
        className
      )}
      {...listeners}
      {...attributes}
    >
      <div className='flex items-center gap-3 px-4 py-3'>
        <div className='bg-primary/10 text-primary group-hover:bg-primary/20 flex h-8 w-8 items-center justify-center rounded-md transition-colors'>
          {icon}
        </div>
        <span className='text-foreground group-hover:text-primary text-sm font-medium transition-colors'>
          {label}
        </span>
        <Icons.add className='text-muted-foreground ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100' />
      </div>
    </div>
  );
}
