'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { SignaturePad } from '@/features/signing/components/signature-pad';
import { toast } from 'sonner';
import http from '@/lib/http';

// Dynamic import to prevent SSR issues
const PDFViewerClient = dynamic(
  () =>
    import('@/features/editor/components/pdf-viewer-client').then((mod) => ({
      default: mod.PDFViewerClient
    })),
  {
    ssr: false,
    loading: () => (
      <div className='flex justify-center p-8'>
        <Icons.spinner className='h-8 w-8 animate-spin' />
      </div>
    )
  }
);

export default function SignDocumentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const documentId = params.id as string;
  const recipientId = searchParams.get('recipientId');

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] = useState<
    string | null
  >(null);

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

        // Initialize field values
        const initialValues: Record<string, string> = {};
        res.data.pages.forEach((page: any) => {
          page.fields.forEach((field: any) => {
            if (field.value) {
              initialValues[field.id] = field.value;
            }
          });
        });
        setFieldValues(initialValues);
      } catch (error) {
        console.error('Failed to load document:', error);
        toast.error('Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, recipientId]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSignatureClick = (fieldId: string) => {
    setCurrentSignatureField(fieldId);
    setShowSignaturePad(true);
  };

  const handleSignatureSave = (dataUrl: string) => {
    if (currentSignatureField) {
      handleFieldChange(currentSignatureField, dataUrl);
      setShowSignaturePad(false);
      setCurrentSignatureField(null);
      toast.success('Signature saved');
    }
  };

  const handleSubmit = async () => {
    // Validate all required fields are filled
    const allFields = document.pages.flatMap((p: any) => p.fields);
    const requiredFields = allFields.filter((f: any) => f.required);
    const missingFields = requiredFields.filter(
      (f: any) => !fieldValues[f.id] || fieldValues[f.id].trim() === ''
    );

    if (missingFields.length > 0) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await http.post(`/api/sign/${documentId}/submit`, {
        recipientId,
        fieldValues
      });

      toast.success('Document signed successfully!');
      // TODO: Show completion screen
    } catch (error) {
      console.error('Failed to submit:', error);
      toast.error('Failed to submit signature');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Icons.spinner className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!document) {
    return (
      <div className='flex h-screen flex-col items-center justify-center'>
        <h1 className='text-2xl font-bold'>Document not found</h1>
        <p className='text-muted-foreground mt-2'>
          The document you&apos;re looking for doesn&apos;t exist or you
          don&apos;t have access.
        </p>
      </div>
    );
  }

  return (
    <div className='flex h-screen flex-col'>
      {/* Header */}
      <div className='border-b bg-white px-6 py-4'>
        <div className='mx-auto max-w-6xl'>
          <h1 className='text-2xl font-bold'>{document.title}</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Signing as:{' '}
            <span className='font-medium'>{document.recipient.name}</span> (
            {document.recipient.email})
          </p>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-auto bg-gray-50 p-6'>
        <div className='mx-auto max-w-4xl space-y-6'>
          {/* PDF Preview with Fields */}
          {document.pdfUrl && (
            <div className='rounded-lg bg-white p-6 shadow'>
              <PDFViewerClient
                pdfUrl={document.pdfUrl}
                documentId={documentId}
                pages={document.pages}
                readOnly={true}
              />
            </div>
          )}

          {/* Signature Pad Modal */}
          {showSignaturePad && (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
              <div className='w-full max-w-md rounded-lg bg-white p-6'>
                <h3 className='mb-4 text-lg font-semibold'>
                  Draw Your Signature
                </h3>
                <SignaturePad
                  onSave={handleSignatureSave}
                  onClear={() => {}}
                  initialValue={
                    currentSignatureField
                      ? fieldValues[currentSignatureField]
                      : undefined
                  }
                />
                <Button
                  variant='ghost'
                  onClick={() => {
                    setShowSignaturePad(false);
                    setCurrentSignatureField(null);
                  }}
                  className='mt-4 w-full'
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className='border-t bg-white px-6 py-4'>
        <div className='mx-auto flex max-w-6xl justify-end'>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className='bg-purple-600 hover:bg-purple-700'
          >
            {submitting ? (
              <>
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                Submitting...
              </>
            ) : (
              'Complete Signing'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
