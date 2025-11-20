import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useEditorStore } from '../store/use-editor-store';
import { CreateRecipientModal } from './create-recipient-modal';
import { useState } from 'react';

interface FieldToolbarProps {
  documentId: string;
  onAssign?: (recipientId: string) => void;
  onProperties?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  className?: string;
  assignedRecipientId?: string | null;
  onDropdownOpenChange?: (open: boolean) => void;
  showCreateModal?: boolean;
  onCreateModalChange?: (open: boolean) => void;
}

export function FieldToolbar({
  documentId,
  onAssign,
  onProperties,
  onDuplicate,
  onDelete,
  className,
  assignedRecipientId,
  onDropdownOpenChange,
  showCreateModal = false,
  onCreateModalChange
}: FieldToolbarProps) {
  const recipients = useEditorStore((state) => state.recipients) || [];
  const assignedRecipient = recipients.find(
    (r) => r.id === assignedRecipientId
  );

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded bg-slate-800 p-1 text-white shadow-xl',
        className
      )}
    >
      <DropdownMenu onOpenChange={onDropdownOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className={cn(
              'h-8 px-2 text-white hover:bg-slate-700 hover:text-white',
              assignedRecipient && 'bg-slate-700'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <Icons.user className='mr-1 h-4 w-4' />
            {assignedRecipient ? assignedRecipient.name : 'Assign'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start' className='w-56'>
          {recipients.length === 0 ? (
            <div className='text-muted-foreground p-2 text-center text-xs'>
              No recipients added
            </div>
          ) : (
            recipients.map((recipient) => (
              <DropdownMenuItem
                key={recipient.id}
                onClick={() => onAssign?.(recipient.id)}
                className='flex items-center gap-2'
              >
                <div
                  className='h-2 w-2 rounded-full'
                  style={{ backgroundColor: recipient.color }}
                />
                <span className='truncate'>{recipient.name}</span>
                {assignedRecipientId === recipient.id && (
                  <Icons.check className='ml-auto h-3 w-3' />
                )}
              </DropdownMenuItem>
            ))
          )}
          {recipients.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem
            onClick={() => onCreateModalChange?.(true)}
            className='text-primary flex items-center gap-2'
          >
            <Icons.add className='h-4 w-4' />
            <span>Create new recipient</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className='mx-1 h-4 w-px bg-slate-600' />

      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 text-white hover:bg-slate-700 hover:text-white'
        onClick={(e) => {
          e.stopPropagation();
          onProperties?.();
        }}
        title='Properties'
      >
        <Icons.settings className='h-4 w-4' />
      </Button>

      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 text-white hover:bg-slate-700 hover:text-white'
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate?.();
        }}
        title='Duplicate'
      >
        <Icons.page className='h-4 w-4' />
      </Button>

      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8 text-white hover:bg-slate-700 hover:text-white'
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.();
        }}
        title='Delete'
      >
        <Icons.trash className='h-4 w-4' />
      </Button>

      <CreateRecipientModal
        documentId={documentId}
        open={showCreateModal}
        onOpenChange={onCreateModalChange || (() => {})}
        onCreated={(recipient) => {
          // Auto-assign the newly created recipient to this field
          onAssign?.(recipient.id);
        }}
      />
    </div>
  );
}
