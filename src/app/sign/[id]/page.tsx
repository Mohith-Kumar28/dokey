'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Icons } from '@/components/icons';
import { SignatureFieldInput } from '@/features/editor/components/field-inputs/signature-field-input';
import { toast } from 'sonner';
import http from '@/lib/http';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { getFieldTypeConfig } from '@/features/editor/config/field-type-config';

const PDFViewerClient = dynamic(
  () =>
    import('@/features/editor/components/pdf-viewer-client').then((mod) => ({
      default: mod.PDFViewerClient
    })),
  {
    ssr: false,
    loading: () => (
      <div className='flex h-full items-center justify-center p-8'>
        <div className='flex flex-col items-center gap-2'>
          <Icons.spinner className='text-primary h-8 w-8 animate-spin' />
          <p className='text-muted-foreground text-sm'>Loading document...</p>
        </div>
      </div>
    )
  }
);

export default function SignDocumentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const documentId = params.id as string;
  const recipientId = searchParams.get('recipientId');
  const containerRef = useRef<HTMLDivElement>(null);

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] = useState<
    string | null
  >(null);
  const [adoptedSignature, setAdoptedSignature] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showFieldList, setShowFieldList] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const debouncedFieldValues = useDebounce(fieldValues, 1000);

  useEffect(() => {
    if (!recipientId) {
      toast.error('Invalid signing link');
      return;
    }

    const fetchDocument = async () => {
      try {
        const res = await http.get(
          `/api/sign/${documentId}?recipientId=${recipientId}`
        );
        setDocument(res.data);

        // Check if recipient has already submitted
        setIsSubmitted(
          res.data.recipient?.submittedAt !== null &&
            res.data.recipient?.submittedAt !== undefined
        );

        const initialValues: Record<string, string> = {};
        let foundSignature = null;

        res.data.pages.forEach((page: any) => {
          page.fields.forEach((field: any) => {
            if (field.value) {
              initialValues[field.id] = field.value;
              if (field.type === 'signature' || field.type === 'stamp') {
                foundSignature = field.value;
              }
            }
          });
        });
        setFieldValues(initialValues);
        if (foundSignature) {
          setAdoptedSignature(foundSignature);
        }
      } catch (error) {
        console.error('Failed to load document:', error);
        toast.error('Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, recipientId]);

  useEffect(() => {
    if (!document || Object.keys(debouncedFieldValues).length === 0) return;

    const saveProgress = async () => {
      setIsSaving(true);
      try {
        await http.patch(`/api/sign/${documentId}/save`, {
          recipientId,
          fieldValues: debouncedFieldValues
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    };

    saveProgress();
  }, [debouncedFieldValues, documentId, recipientId, document]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSignatureClick = (fieldId: string) => {
    const currentValue = fieldValues[fieldId];

    if (currentValue) {
      setCurrentSignatureField(fieldId);
      setShowSignaturePad(true);
      return;
    }

    if (adoptedSignature) {
      handleFieldChange(fieldId, adoptedSignature);
      toast.success('Signature applied');
      return;
    }

    setCurrentSignatureField(fieldId);
    setShowSignaturePad(true);
  };

  const handleSignatureSave = (dataUrl: string) => {
    if (currentSignatureField) {
      handleFieldChange(currentSignatureField, dataUrl);
      setAdoptedSignature(dataUrl);
      setShowSignaturePad(false);
      setCurrentSignatureField(null);
      toast.success('Signature saved and adopted');
    }
  };

  const allFieldsWithMetadata = useMemo(() => {
    if (!document) return [];

    return document.pages.flatMap((page: any, pageIndex: number) =>
      page.fields.map((field: any) => ({
        ...field,
        pageNumber: page.pageNumber,
        pageIndex,
        isComplete:
          fieldValues[field.id] && fieldValues[field.id].trim() !== '',
        config: getFieldTypeConfig(field.type)
      }))
    );
  }, [document, fieldValues]);

  const progressStats = useMemo(() => {
    const requiredFields = allFieldsWithMetadata.filter((f: any) => f.required);
    const completedRequired = requiredFields.filter((f: any) => f.isComplete);
    const nextField = requiredFields.find((f: any) => !f.isComplete);

    return {
      total: requiredFields.length,
      completed: completedRequired.length,
      percent:
        requiredFields.length > 0
          ? Math.round((completedRequired.length / requiredFields.length) * 100)
          : 100,
      nextFieldId: nextField?.id || null,
      allComplete:
        requiredFields.length > 0 &&
        completedRequired.length === requiredFields.length
    };
  }, [allFieldsWithMetadata]);

  const scrollToField = (fieldId: string) => {
    const el = window.document.getElementById(`field-${fieldId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-primary', 'ring-offset-2');
      }, 2000);
    } else {
      toast.error('Field not found on current page');
    }
  };

  const handleSubmit = async () => {
    if (isSubmitted) return;

    if (!progressStats.allComplete) {
      toast.error('Please fill all required fields');
      if (progressStats.nextFieldId) {
        scrollToField(progressStats.nextFieldId);
      }
      return;
    }

    setSubmitting(true);
    try {
      const response = await http.post(`/api/sign/${documentId}/submit`, {
        recipientId,
        fieldValues
      });

      if (response.data.success) {
        setIsSubmitted(true);
        toast.success('Document submitted successfully!');
        // Optionally redirect to a success page
        // router.push(`/api/sign/${documentId}/success`);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(
        error.response?.data?.error ||
          'Failed to submit document. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentFieldType = () => {
    if (!currentSignatureField || !document) return 'signature';
    const field = allFieldsWithMetadata.find(
      (f: any) => f.id === currentSignatureField
    );
    return field?.type === 'stamp' ? 'stamp' : 'signature';
  };

  const handleReset = async () => {
    try {
      // Create empty values for all fields to clear them in backend
      const emptyFieldValues: Record<string, string> = {};
      allFieldsWithMetadata.forEach((field: any) => {
        emptyFieldValues[field.id] = '';
      });

      // Reset on backend
      await http.patch(`/api/sign/${documentId}/save`, {
        recipientId,
        fieldValues: emptyFieldValues
      });

      // Reset on frontend
      setFieldValues({});
      setAdoptedSignature(null);
      setShowResetDialog(false);
      toast.success('All fields have been reset');
    } catch (error) {
      console.error('Failed to reset fields:', error);
      toast.error('Failed to reset fields');
    }
  };

  const handleFieldReset = (fieldId: string) => {
    // Set to empty string instead of deleting so auto-save sends it to backend
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: ''
    }));
    toast.success('Field cleared');
  };

  if (loading) {
    return (
      <div className='bg-background flex h-screen items-center justify-center'>
        <Card className='w-96'>
          <CardContent className='pt-6'>
            <div className='flex flex-col items-center gap-4'>
              <Icons.spinner className='text-primary h-12 w-12 animate-spin' />
              <div className='text-center'>
                <p className='font-semibold'>Loading document...</p>
                <p className='text-muted-foreground mt-1 text-sm'>
                  Please wait
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <div className='bg-background flex h-screen items-center justify-center'>
        <Card className='w-96'>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <h2 className='mb-2 text-lg font-semibold'>Document not found</h2>
              <p className='text-muted-foreground text-sm'>
                The document you&apos;re looking for doesn&apos;t exist or you
                don&apos;t have access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className='bg-background flex h-screen flex-col'>
        {/* Header with Progress and Actions */}
        <header className='bg-card border-b shadow-sm'>
          <div className='flex h-14 items-center gap-6 px-6'>
            {/* Document info */}
            <div className='flex min-w-0 items-center gap-2.5'>
              <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg'>
                <Icons.file className='text-primary h-4 w-4' />
              </div>
              <div className='min-w-0'>
                <h1 className='max-w-[200px] truncate text-sm font-medium'>
                  {document.title}
                </h1>
                {isSaving && (
                  <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                    <Icons.spinner className='h-3 w-3 animate-spin' />
                    Saving changes
                  </span>
                )}
              </div>
            </div>

            {/* Progress indicator */}
            <div className='hidden flex-1 items-center gap-3 md:flex'>
              <div className='flex flex-1 items-center gap-2.5'>
                <Progress
                  value={progressStats.percent}
                  className='h-1.5 max-w-xs flex-1'
                />
                <div className='flex items-center gap-2'>
                  <span className='text-foreground text-xs font-medium'>
                    {progressStats.completed}/{progressStats.total}
                  </span>
                  <Badge
                    variant={
                      progressStats.allComplete ? 'default' : 'secondary'
                    }
                    className='px-2 py-0.5 text-[10px] font-semibold'
                  >
                    {progressStats.percent}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className='ml-auto flex items-center gap-2'>
              {isSubmitted && <Badge variant='default'>Submitted</Badge>}

              {!isSubmitted && progressStats.completed > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setShowResetDialog(true)}
                      className='text-destructive hover:bg-destructive/10 h-8 gap-2 px-3'
                    >
                      <Icons.trash className='h-4 w-4' />
                      <span className='hidden sm:inline'>Reset</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side='bottom'>
                    Reset all fields
                  </TooltipContent>
                </Tooltip>
              )}

              {!isSubmitted && !progressStats.allComplete && (
                <Button
                  onClick={() => scrollToField(progressStats.nextFieldId!)}
                  size='sm'
                  className='h-8 gap-1.5'
                >
                  <span>Next Field</span>
                  <Icons.chevronDown className='h-3.5 w-3.5' />
                </Button>
              )}

              {!isSubmitted && progressStats.allComplete && (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  size='sm'
                  className='h-8 min-w-[130px] gap-1.5'
                >
                  {submitting ? (
                    <>
                      <Icons.spinner className='h-3.5 w-3.5 animate-spin' />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Document</span>
                      <Icons.check className='h-3.5 w-3.5' />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className='flex flex-1 overflow-hidden'>
          {/* Document Viewer */}
          <div
            ref={containerRef}
            className='bg-muted/30 flex-1 overflow-auto p-4 sm:p-6'
          >
            <div className='mx-auto max-w-5xl'>
              {document.pdfUrl && (
                <Card>
                  <CardContent className='p-0'>
                    <PDFViewerClient
                      pdfUrl={document.pdfUrl}
                      documentId={documentId}
                      pages={document.pages}
                      scale={1}
                      readOnly={true}
                      disabled={isSubmitted}
                      fieldValues={fieldValues}
                      onFieldChange={(id, val) => {
                        if (val === 'INTERACT') {
                          handleSignatureClick(id);
                        } else {
                          handleFieldChange(id, val);
                        }
                      }}
                      onSignatureClick={handleSignatureClick}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Field List Sidebar */}
          {showFieldList && (
            <div className='bg-card hidden w-80 border-l shadow-sm lg:block'>
              <div className='flex h-full flex-col'>
                <div className='bg-muted/30 flex items-center justify-between border-b px-4 py-3'>
                  <div>
                    <h2 className='text-sm font-semibold'>Document Fields</h2>
                    <p className='text-muted-foreground text-xs'>
                      {isSubmitted
                        ? 'Document submitted'
                        : `${progressStats.completed} of ${progressStats.total} completed`}
                    </p>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setShowFieldList(false)}
                    className='h-7 w-7'
                  >
                    <Icons.close className='h-3.5 w-3.5' />
                  </Button>
                </div>

                <ScrollArea className='flex-1'>
                  <div className='space-y-2 p-4'>
                    {allFieldsWithMetadata.length === 0 ? (
                      <p className='text-muted-foreground py-8 text-center text-sm'>
                        No fields in this document
                      </p>
                    ) : (
                      allFieldsWithMetadata.map((field: any) => {
                        const FieldIcon =
                          Icons[field.config.icon as keyof typeof Icons] ||
                          Icons.file;

                        return (
                          <div
                            key={field.id}
                            onClick={() => scrollToField(field.id)}
                            className={cn(
                              'relative w-full cursor-pointer rounded-lg border p-3 text-left transition-all',
                              field.isComplete
                                ? 'bg-primary/5 border-primary/20 hover:border-primary/40 hover:bg-primary/10'
                                : 'border-border hover:border-primary/30 hover:bg-accent/50'
                            )}
                          >
                            <div className='flex items-start gap-2.5'>
                              <div
                                className={cn(
                                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md',
                                  field.isComplete
                                    ? 'bg-primary/10'
                                    : 'bg-muted'
                                )}
                              >
                                <FieldIcon
                                  className={cn(
                                    'h-3.5 w-3.5',
                                    field.isComplete
                                      ? 'text-primary'
                                      : 'text-muted-foreground'
                                  )}
                                />
                              </div>

                              <div className='min-w-0 flex-1'>
                                <p className='truncate text-sm leading-tight font-medium'>
                                  {field.label || field.config.label}
                                </p>
                                <div className='text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs'>
                                  <span>Page {field.pageNumber}</span>
                                  {field.required && (
                                    <>
                                      <span>•</span>
                                      <span>Required</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Status indicator with reset */}
                              <div className='flex flex-shrink-0 items-center gap-1.5'>
                                {!isSubmitted && field.isComplete && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant='ghost'
                                        size='icon'
                                        className='text-destructive hover:text-destructive hover:bg-destructive/10 h-6 w-6 rounded-md'
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleFieldReset(field.id);
                                        }}
                                      >
                                        <Icons.trash className='h-3.5 w-3.5' />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side='left'>
                                      Clear this field
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Floating button to show field list on large screens */}
          {!showFieldList && (
            <div className='absolute top-24 right-4 z-10 hidden lg:block'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => setShowFieldList(true)}
                    className='shadow-lg'
                  >
                    <Icons.list className='h-5 w-5' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='left'>Show field list</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Signature Modal */}
        {showSignaturePad && (
          <SignatureFieldInput
            value={
              currentSignatureField
                ? fieldValues[currentSignatureField]
                : undefined
            }
            onSave={handleSignatureSave}
            onCancel={() => {
              setShowSignaturePad(false);
              setCurrentSignatureField(null);
            }}
            type={getCurrentFieldType()}
          />
        )}

        {/* Reset Confirmation Dialog */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all fields?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all filled fields including signatures. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReset}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                Reset All Fields
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
