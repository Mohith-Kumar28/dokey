'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Step1GetStarted } from './step-1-get-started';
import { Step2Recipients, Recipient } from './step-2-recipients';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateDocument } from '@/features/documents/queries';
import axios from 'axios';
import { toast } from 'sonner';

interface DocumentCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentCreationWizard({
  open,
  onOpenChange
}: DocumentCreationWizardProps) {
  const [step, setStep] = useState(1);
  const [creationData, setCreationData] = useState<{
    templateId?: string;
    mode?: 'blank' | 'template' | 'upload';
    documentName?: string;
    file?: File;
  }>({});

  const router = useRouter();
  const createMutation = useCreateDocument();
  const [isCreating, setIsCreating] = useState(false);

  const handleStep1Next = (data: {
    templateId?: string;
    mode: 'blank' | 'template' | 'upload';
    file?: File;
  }) => {
    setCreationData(data);
    setStep(2);
  };

  const handleStep2Next = async (
    recipients: Recipient[],
    documentName: string
  ) => {
    setIsCreating(true);
    try {
      const doc = await createMutation.mutateAsync({
        title: documentName || 'Untitled Document',
        templateId: creationData.templateId
      });

      if (recipients.length > 0 && recipients.some((r) => r.email || r.name)) {
        await axios.post(`/api/documents/${doc.id}/recipients`, {
          recipients: recipients
            .filter((r) => r.email || r.name)
            .map((r) => ({
              name: r.name,
              email: r.email,
              role: r.role,
              deliveryMethod: r.deliveryMethod
            }))
        });
      }

      toast.success('Document created successfully');
      onOpenChange(false);
      setStep(1); // Reset for next time
      router.push(`/dashboard/document/${doc.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create document');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSkip = async () => {
    setIsCreating(true);
    try {
      const doc = await createMutation.mutateAsync({
        title: 'Untitled Document',
        templateId: creationData.templateId
      });

      toast.success('Document created successfully');
      onOpenChange(false);
      setStep(1);
      router.push(`/dashboard/document/${doc.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create document');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='h-[90vh] max-w-6xl p-0'>
        {step === 1 && (
          <Step1GetStarted onNext={handleStep1Next} currentStep={1} />
        )}
        {step === 2 && (
          <Step2Recipients
            onBack={() => setStep(1)}
            onNext={handleStep2Next}
            onSkip={handleSkip}
            isLoading={isCreating}
            currentStep={2}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
