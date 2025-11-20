'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

export interface Recipient {
  id: string;
  name: string;
  email: string;
  role: string;
  deliveryMethod: 'email' | 'sms' | 'link';
}

interface Step2Props {
  initialRecipients?: Recipient[];
  onBack: () => void;
  onNext: (recipients: Recipient[], documentName: string) => void;
  onSkip: () => void;
  isLoading?: boolean;
  currentStep: number;
}

export function Step2Recipients({
  onBack,
  onNext,
  onSkip,
  isLoading,
  currentStep
}: Step2Props) {
  const [docName, setDocName] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: '1', name: '', email: '', role: 'sender', deliveryMethod: 'email' },
    { id: '2', name: '', email: '', role: 'client', deliveryMethod: 'email' }
  ]);

  const addRecipient = () => {
    setRecipients([
      ...recipients,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        email: '',
        role: 'client',
        deliveryMethod: 'email'
      }
    ]);
  };

  const updateRecipient = (id: string, value: string) => {
    setRecipients(
      recipients.map((r) => (r.id === id ? { ...r, email: value } : r))
    );
  };

  return (
    <div className='bg-background flex h-full flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between border-b px-6 py-4'>
        <Button variant='ghost' size='sm' onClick={onBack}>
          <Icons.chevronLeft className='mr-2 h-4 w-4' />
          Back
        </Button>

        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-2'>
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs text-white'>
              <Icons.check className='h-4 w-4' />
            </div>
            <span className='text-sm font-medium text-green-600 dark:text-green-400'>
              Get started
            </span>
          </div>

          <Icons.chevronRight className='text-muted-foreground h-4 w-4' />

          <div className='flex items-center gap-2'>
            <div className='bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium'>
              •
            </div>
            <span className='text-sm font-medium'>Add recipients</span>
          </div>

          <Icons.chevronRight className='text-muted-foreground h-4 w-4' />

          <div className='flex items-center gap-2'>
            <div className='border-muted text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs'></div>
            <span className='text-muted-foreground text-sm'>
              Review content
            </span>
          </div>
        </div>

        <Button variant='ghost' size='icon' onClick={() => {}}>
          <Icons.close className='h-4 w-4' />
        </Button>
      </div>

      {/* Main Content */}
      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto max-w-3xl space-y-6 px-6 py-8'>
          <div className='space-y-2'>
            <h2 className='text-2xl font-semibold'>Add document recipients</h2>
            <p className='text-muted-foreground text-sm'>
              This template includes roles, which help assign fields to
              recipients automatically.
            </p>
          </div>

          {/* Document Name */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>
              Document name <span className='text-destructive'>*</span>
            </Label>
            <Input
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder='Sample Sales Proposal'
            />
          </div>

          {/* Recipients */}
          <div className='space-y-4'>
            {recipients.map((recipient, index) => (
              <div key={recipient.id} className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <Label className='text-sm font-medium'>Add recipient</Label>
                  <Badge
                    variant='secondary'
                    className={
                      recipient.role === 'sender'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }
                  >
                    {recipient.role.toUpperCase()}
                  </Badge>
                </div>
                <Input
                  value={recipient.email}
                  onChange={(e) =>
                    updateRecipient(recipient.id, e.target.value)
                  }
                  placeholder='Start typing name, email or group'
                  className='border-l-4 border-l-orange-500'
                />
              </div>
            ))}

            <Button
              variant='ghost'
              className='text-muted-foreground w-full justify-start'
              onClick={addRecipient}
            >
              <Icons.add className='mr-2 h-4 w-4' />
              Add recipient
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className='flex items-center justify-end gap-2 border-t px-6 py-4'>
        <Button variant='ghost' onClick={onSkip} disabled={isLoading}>
          Skip
        </Button>
        <Button
          onClick={() => onNext(recipients, docName)}
          disabled={isLoading || !docName}
          className='bg-green-600 text-white hover:bg-green-700'
        >
          {isLoading ? (
            <>
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              Creating...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  );
}
