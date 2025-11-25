import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { FieldToolbar } from './field-toolbar';
import { useEditorStore } from '../store/use-editor-store';
import { useState, useRef } from 'react';
import { getFieldTypeConfig } from '../config/field-type-config';
import { TextFieldInput } from './field-inputs/text-field-input';
import { CheckboxFieldInput } from './field-inputs/checkbox-field-input';
import { DropdownFieldInput } from './field-inputs/dropdown-field-input';
import { DateFieldInput } from './field-inputs/date-field-input';
import { SignatureFieldInput } from './field-inputs/signature-field-input';

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
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    options?: string[];
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
  const [isEditMode, setIsEditMode] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);

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

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Double click detected on field:', field.id, field.type);
    // Only enter edit mode for editable field types
    const editableTypes = [
      'text',
      'date',
      'checkbox',
      'dropdown',
      'signature',
      'stamp'
    ];
    if (editableTypes.includes(field.type.toLowerCase())) {
      console.log('Entering edit mode for field:', field.id);
      setIsEditMode(true);
    } else {
      console.log('Field type not editable:', field.type);
    }
  };

  const handleSaveValue = (value: string) => {
    updateField(pageNumber, field.id, { value });
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
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
          {...attributes}
          tabIndex={0}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Interaction Layer - Only active when not editing */}
          {!isEditMode && (
            <div
              className='absolute inset-0 z-20'
              {...listeners}
              onDoubleClick={handleDoubleClick}
              onPointerDown={(e) => {
                e.stopPropagation();
                selectField(field.id);
                listeners?.onPointerDown?.(e);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectField(field.id);
                }
                listeners?.onKeyDown?.(e);
              }}
            />
          )}

          {(() => {
            if (isEditMode) {
              return (
                <div
                  className='relative z-30 h-full w-full'
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  {(() => {
                    switch (field.type.toLowerCase()) {
                      case 'text':
                        return (
                          <TextFieldInput
                            value={field.value || ''}
                            onSave={handleSaveValue}
                            onCancel={handleCancelEdit}
                            placeholder={field.placeholder || 'Enter text...'}
                            width={field.width}
                            height={field.height}
                          />
                        );
                      case 'checkbox':
                        return (
                          <CheckboxFieldInput
                            value={field.value}
                            onSave={handleSaveValue}
                          />
                        );
                      case 'dropdown':
                        return (
                          <DropdownFieldInput
                            value={field.value}
                            onSave={handleSaveValue}
                            options={field.options}
                            placeholder={field.placeholder}
                            width={field.width}
                            height={field.height}
                          />
                        );
                      case 'date':
                        return (
                          <DateFieldInput
                            value={field.value}
                            onSave={handleSaveValue}
                            width={field.width}
                            height={field.height}
                          />
                        );
                      case 'signature':
                      case 'stamp':
                        return (
                          <SignatureFieldInput
                            value={field.value}
                            onSave={handleSaveValue}
                            onCancel={handleCancelEdit}
                            type={
                              field.type.toLowerCase() as 'signature' | 'stamp'
                            }
                          />
                        );
                      default:
                        return null;
                    }
                  })()}
                </div>
              );
            }

            // Display Mode
            switch (field.type.toLowerCase()) {
              case 'checkbox':
                return (
                  <div className='flex h-full w-full items-center justify-center'>
                    {field.value === 'true' || field.value === 'checked' ? (
                      <Icons.checkSquare className='h-4 w-4' />
                    ) : (
                      <Icons.square className='h-4 w-4' />
                    )}
                  </div>
                );
              case 'signature':
              case 'stamp':
                return field.value ? (
                  <img
                    src={field.value}
                    alt={field.type}
                    className='h-full w-full object-contain'
                  />
                ) : (
                  <>
                    <FieldIcon className='h-3 w-3' />
                    <span className='pointer-events-none flex-1 truncate px-0.5 font-medium select-none'>
                      {field.type}
                    </span>
                  </>
                );
              default:
                return (
                  <>
                    <FieldIcon className='h-3 w-3' />
                    <span className='pointer-events-none flex-1 truncate px-0.5 font-medium select-none'>
                      {field.value || field.label || field.type}
                    </span>
                  </>
                );
            }
          })()}
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
          onEdit={() => setIsEditMode(true)}
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
