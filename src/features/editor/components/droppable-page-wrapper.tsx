'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { DraggableField } from './draggable-field';
import { SigningField } from './signing-field';

interface DroppablePageWrapperProps {
  pageNumber: number;
  children: React.ReactNode;
  className?: string;
  fields?: any[];
  documentId: string;
  selectedRecipientId?: string; // 'all' or specific recipient ID
  scale?: number;
  readOnly?: boolean;
  fieldValues?: Record<string, string>;
  onFieldChange?: (fieldId: string, value: string) => void;
  onSignatureClick?: (fieldId: string) => void;
}

export function DroppablePageWrapper({
  pageNumber,
  children,
  className,
  fields = [],
  documentId,
  selectedRecipientId = 'all',
  scale = 1,
  readOnly = false,
  fieldValues,
  onFieldChange,
  onSignatureClick
}: DroppablePageWrapperProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `page-${pageNumber}`,
    data: {
      pageNumber,
      isPage: true
    }
  });

  // Filter fields based on selected recipient
  const filteredFields =
    selectedRecipientId === 'all'
      ? fields
      : fields.filter((field) => field.recipientId === selectedRecipientId);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative mx-auto w-fit transition-colors',
        isOver && 'ring-primary ring-2 ring-offset-2',
        className
      )}
    >
      {children}

      {/* Render Fields */}
      {filteredFields.map((field) =>
        readOnly ? (
          <SigningField
            key={field.id}
            field={field}
            scale={scale}
            value={fieldValues?.[field.id]}
            onChange={(value) => onFieldChange?.(field.id, value)}
            onInteract={() => onSignatureClick?.(field.id)}
          />
        ) : (
          <DraggableField
            key={field.id}
            field={field}
            pageNumber={pageNumber}
            documentId={documentId}
            scale={scale}
          />
        )
      )}

      {/* Overlay for drop indication */}
      {isOver && (
        <div className='bg-primary/10 pointer-events-none absolute inset-0 z-[200]' />
      )}
    </div>
  );
}
