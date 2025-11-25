'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useSendDocument } from '@/features/documents/queries';
import { toast } from 'sonner';
import { Recipient } from '../store/use-editor-store';

interface SendDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  recipients: Recipient[];
}

export function SendDocumentModal({
  open,
  onOpenChange,
  documentId,
  recipients
}: SendDocumentModalProps) {
  const sendMutation = useSendDocument(documentId);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSend = async () => {
    try {
      await sendMutation.mutateAsync();
      setIsSuccess(true);
      toast.success('Document sent successfully');
    } catch (error) {
      toast.error('Failed to send document');
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    onOpenChange(false);
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className='sm:max-w-md'>
          <div className='flex flex-col items-center justify-center space-y-4 py-8 text-center'>
            <div className='rounded-full bg-green-100 p-3'>
              <Icons.check className='h-8 w-8 text-green-600' />
            </div>
            <DialogTitle>Document Sent!</DialogTitle>
            <DialogDescription>
              Your document has been sent to {recipients.length} recipients.
            </DialogDescription>
            <Button onClick={handleClose} className='w-full max-w-xs'>
              Return to Editor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Send Document</DialogTitle>
          <DialogDescription>
            Review recipients before sending. They will receive an email with a
            link to sign.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='text-muted-foreground text-sm font-medium'>
            Recipients ({recipients.length})
          </div>
          {recipients.length === 0 ? (
            <div className='text-muted-foreground bg-muted/50 rounded-md border p-4 text-center text-sm italic'>
              No recipients added yet. Add recipients from the sidebar.
            </div>
          ) : (
            <div className='max-h-[200px] space-y-2 overflow-y-auto pr-2'>
              {recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className='bg-card flex items-center justify-between rounded-md border p-2'
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className='flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white'
                      style={{ backgroundColor: recipient.color }}
                    >
                      {recipient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className='text-sm font-medium'>
                        {recipient.name}
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        {recipient.email} • {recipient.role}
                      </div>
                    </div>
                  </div>
                  <Icons.mail className='text-muted-foreground h-4 w-4' />
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={recipients.length === 0 || sendMutation.isPending}
            className='bg-green-600 text-white hover:bg-green-700'
          >
            {sendMutation.isPending ? (
              <>
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                Sending...
              </>
            ) : (
              <>
                Send Document
                <Icons.send className='ml-2 h-4 w-4' />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
