'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useCreateRecipient } from '@/features/documents/queries';
import { useEditorStore } from '../store/use-editor-store';
import { toast } from 'sonner';

interface CreateRecipientModalProps {
  documentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (recipient: any) => void;
}

export function CreateRecipientModal({
  documentId,
  open,
  onOpenChange,
  onCreated
}: CreateRecipientModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showMoreFields, setShowMoreFields] = useState(false);

  const createRecipientMutation = useCreateRecipient(documentId);
  const addRecipient = useEditorStore((state) => state.addRecipient);

  const handleSubmit = async () => {
    if (!firstName.trim() || !email.trim()) {
      toast.error('First name and email are required');
      return;
    }

    const name = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      const recipient = await createRecipientMutation.mutateAsync({
        email: email.trim(),
        name,
        role: 'signer',
        deliveryMethod: 'email'
      });

      // Optimistically add to store
      addRecipient(recipient);

      onCreated?.(recipient);
      toast.success('Recipient added');

      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhoneNumber('');
      setShowMoreFields(false);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create recipient');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Create new recipient</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='firstName'>FIRST NAME</Label>
              <Input
                id='firstName'
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder='John'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='lastName'>LAST NAME</Label>
              <Input
                id='lastName'
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder='Doe'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email'>EMAIL</Label>
            <Input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='john@example.com'
            />
          </div>

          {!showMoreFields && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowMoreFields(true)}
              className='text-primary hover:text-primary'
            >
              More fields
              <Icons.chevronRight className='ml-1 h-4 w-4 rotate-90' />
            </Button>
          )}

          {showMoreFields && (
            <div className='space-y-2'>
              <Label htmlFor='phoneNumber'>PHONE NUMBER</Label>
              <Input
                id='phoneNumber'
                type='tel'
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder='+1 (555) 000-0000'
              />
            </div>
          )}
        </div>

        <div className='flex justify-end gap-2'>
          <Button
            variant='ghost'
            onClick={() => {
              onOpenChange(false);
              setFirstName('');
              setLastName('');
              setEmail('');
              setPhoneNumber('');
              setShowMoreFields(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createRecipientMutation.isPending}
            className='bg-primary hover:bg-primary/90'
          >
            {createRecipientMutation.isPending ? (
              <>
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                Creating...
              </>
            ) : (
              'Create'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
