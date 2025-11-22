import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { FieldToolbar } from './field-toolbar';
import { useEditorStore } from '../store/use-editor-store';
import { useState, useRef } from 'react';

interface DraggableFieldProps {
  field: {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    pageId: string;
    value?: string | null;
    required?: boolean;
    recipientId?: string | null;
  };
  pageNumber: number;
  documentId: string;
}

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

export function DraggableField({
  field,
  pageNumber,
  documentId
}: DraggableFieldProps) {
  const selectedFieldId = useEditorStore((state) => state.selectedFieldId);
  const selectField = useEditorStore((state) => state.selectField);
  const deleteField = useEditorStore((state) => state.deleteField);
  const duplicateField = useEditorStore((state) => state.duplicateField);
  const updateField = useEditorStore((state) => state.updateField);
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSelected = selectedFieldId === field.id;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: field.id,
      data: {
        type: field.type,
        fieldId: field.id,
        isField: true,
        width: field.width,
        height: field.height
      }
    });

  const showToolbar =
    (isSelected || isHovered || isDropdownOpen || showCreateModal) &&
    !isDragging;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
      }
    : undefined;

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  return (
    <Popover open={showToolbar}>
      <PopoverTrigger asChild>
        <div
          ref={setNodeRef}
          style={{
            ...style,
            left: field.x,
            top: field.y,
            width: field.width,
            height: field.height
          }}
          className={cn(
            'group absolute z-[100] flex cursor-move items-center justify-center text-xs transition-shadow',
            'border border-blue-500 bg-blue-50/80 text-blue-700',
            isSelected && 'ring-2 ring-blue-600 ring-offset-1',
            isDragging && 'opacity-50',
            !isDragging && 'hover:shadow-md'
          )}
          {...listeners}
          {...attributes}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            selectField(field.id);
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span className='pointer-events-none truncate px-1 font-medium select-none'>
            {field.type}
          </span>
          {field.recipientId && (
            <div
              className='absolute -top-1 -right-1 h-3 w-3 rounded-full border border-white shadow-sm'
              style={{
                backgroundColor:
                  useEditorStore
                    .getState()
                    .recipients.find((r) => r.id === field.recipientId)
                    ?.color || '#94a3b8'
              }}
            />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className='w-auto border-none bg-transparent p-0 shadow-none'
        side='top'
        sideOffset={5}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <FieldToolbar
          documentId={documentId}
          assignedRecipientId={field.recipientId}
          onDropdownOpenChange={setIsDropdownOpen}
          showCreateModal={showCreateModal}
          onCreateModalChange={setShowCreateModal}
          onAssign={(recipientId) => {
            useEditorStore
              .getState()
              .updateField(pageNumber, field.id, { recipientId });
          }}
          onProperties={() => console.log('Properties')}
          onDuplicate={() => duplicateField(pageNumber, field.id)}
          onDelete={() => deleteField(pageNumber, field.id)}
        />
      </PopoverContent>
    </Popover>
  );
}
