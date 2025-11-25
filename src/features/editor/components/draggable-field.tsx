import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { FieldToolbar } from './field-toolbar';
import { useEditorStore } from '../store/use-editor-store';
import { useState, useRef } from 'react';
import { getFieldTypeConfig } from '../config/field-type-config';

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
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectField = useEditorStore((state) => state.selectField);
  const isSelected = useEditorStore(
    (state) => state.selectedFieldId === field.id
  );
  const deleteField = useEditorStore((state) => state.deleteField);
  const updateField = useEditorStore((state) => state.updateField);
  const addField = useEditorStore((state) => state.addField);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: field.id,
      data: {
        isField: true,
        field,
        pageNumber
      }
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
      }
    : undefined;

  // Field toolbar should show when:
  // 1. Field is selected OR
  // 2. Field is hovered OR
  // 3. Dropdown is open OR
  // 4. Create modal is open
  const showToolbar =
    isSelected || isHovered || isDropdownOpen || showCreateModal;

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

  const handleDelete = () => {
    console.log(
      '[DraggableField] handleDelete called for field:',
      field.id,
      'on page:',
      pageNumber
    );

    // Close popover and deselect immediately
    setIsHovered(false);
    setIsDropdownOpen(false);
    setShowCreateModal(false);
    selectField(null);

    // Then delete the field
    deleteField(pageNumber, field.id);
  };

  const handleAssign = (recipientId: string) => {
    updateField(pageNumber, field.id, { recipientId });
  };

  const handleDuplicate = () => {
    const newField = {
      ...field,
      id: `temp_${Date.now()}`,
      x: field.x + 20, // Offset slightly
      y: field.y + 20
    };

    addField(pageNumber, newField);
  };

  // Get field type configuration
  const fieldConfig = getFieldTypeConfig(field.type);
  const FieldIcon = Icons[fieldConfig.icon];

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
            'group absolute z-10 flex cursor-move items-center justify-center gap-1.5 text-xs transition-shadow',
            `border ${fieldConfig.borderColor} ${fieldConfig.bgColor} ${fieldConfig.textColor}`,
            isSelected && 'ring-2 ring-offset-1',
            isSelected && `ring-${fieldConfig.color}-600`,
            isDragging && 'opacity-50',
            !isDragging && 'hover:shadow-md'
          )}
          {...listeners}
          {...attributes}
          tabIndex={0}
          onPointerDown={(e) => {
            // Select immediately on mouse down (like Figma/Canva)
            e.stopPropagation();
            selectField(field.id);
            // Pass event to dnd-kit listeners
            listeners?.onPointerDown?.(e);
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              selectField(field.id);
            }
            listeners?.onKeyDown?.(e);
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <FieldIcon className='h-3 w-3' />
          <span className='pointer-events-none flex-1 truncate px-0.5 font-medium select-none'>
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
          onAssign={handleAssign}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onDropdownOpenChange={setIsDropdownOpen}
          assignedRecipientId={field.recipientId}
          documentId={documentId}
          showCreateModal={showCreateModal}
          onCreateModalChange={setShowCreateModal}
        />
      </PopoverContent>
    </Popover>
  );
}
