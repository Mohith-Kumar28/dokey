'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { Document, Page, pdfjs } from 'react-pdf';
import { useUploadPDF } from '@/features/documents/use-upload-pdf';
import { DroppablePageWrapper } from './droppable-page-wrapper';
import { useEditorStore } from '../store/use-editor-store';

// Set up PDF.js worker using unpkg CDN for better version reliability
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerClientProps {
  documentId: string;
  pdfUrl?: string;
  pages: Array<{
    id: string;
    pageNumber: number;
    width: number;
    height: number;
    pdfPageIndex?: number;
    fields: Array<{
      id: string;
      type: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
  }>;
  onPdfUploaded?: (url: string) => void;
  selectedRecipientId?: string;
  scale?: number;
  readOnly?: boolean;
  disabled?: boolean;
  fieldValues?: Record<string, string>;
  onFieldChange?: (fieldId: string, value: string) => void;
  onSignatureClick?: (fieldId: string) => void;
}

const pdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true
};

export function PDFViewerClient({
  documentId,
  pdfUrl,
  pages,
  onPdfUploaded,
  selectedRecipientId = 'all',
  scale = 1,
  readOnly = false,
  disabled = false,
  fieldValues,
  onFieldChange,
  onSignatureClick
}: PDFViewerClientProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(pdfUrl);
  const uploadPDF = useUploadPDF(documentId);

  // Sync pdfUrl prop to state when it changes (e.g. after refetch)
  useEffect(() => {
    if (pdfUrl) {
      setCurrentPdfUrl(pdfUrl);
    }
  }, [pdfUrl]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      try {
        const result = await uploadPDF.mutateAsync(file);
        setCurrentPdfUrl(result.pdfUrl);
        onPdfUploaded?.(result.pdfUrl);
        toast.success('PDF uploaded successfully');
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload PDF');
      }
    },
    [uploadPDF, onPdfUploaded]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  if (!currentPdfUrl) {
    return (
      <div className='relative h-full w-full overflow-auto bg-gray-50'>
        <div className='mx-auto flex min-h-full flex-col items-center justify-start gap-4 py-8'>
          <div className='flex w-[800px] items-center justify-between rounded-lg border bg-white p-4 shadow-sm'>
            <div>
              <p className='font-medium'>No PDF document</p>
              <p className='text-muted-foreground text-xs'>
                Upload a PDF or drop fields on the pages below
              </p>
            </div>
            <label htmlFor='pdf-upload'>
              <Button
                variant='outline'
                size='sm'
                disabled={uploadPDF.isPending}
                asChild
              >
                <span>
                  {uploadPDF.isPending ? (
                    <>
                      <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Icons.upload className='mr-2 h-4 w-4' />
                      Upload PDF
                    </>
                  )}
                </span>
              </Button>
            </label>
            <input
              id='pdf-upload'
              type='file'
              accept='application/pdf'
              className='hidden'
              onChange={handleFileInputChange}
              disabled={uploadPDF.isPending}
            />
          </div>

          {/* Render placeholder pages for field drops */}
          <div className='space-y-4'>
            {pages.map((pageData) => (
              <DroppablePageWrapper
                key={`page_${pageData.pageNumber}`}
                pageNumber={pageData.pageNumber}
                className='mb-4'
                fields={pageData?.fields || []}
                documentId={documentId}
                selectedRecipientId={selectedRecipientId}
                scale={scale}
              >
                <div
                  className='bg-white shadow-lg'
                  style={{
                    width: (pageData.width || 612) * scale,
                    height: (pageData.height || 792) * scale
                  }}
                >
                  <div className='flex h-full w-full items-center justify-center'>
                    <div className='text-muted-foreground text-center'>
                      <p className='text-sm'>Page {pageData.pageNumber}</p>
                      <p className='text-xs'>Drop fields here</p>
                    </div>
                  </div>
                </div>
              </DroppablePageWrapper>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4 p-4'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-sm'>
          {numPages} {numPages === 1 ? 'page' : 'pages'}
        </p>
        {!readOnly && (
          <>
            <label htmlFor='pdf-replace'>
              <Button
                variant='outline'
                size='sm'
                disabled={uploadPDF.isPending}
                asChild
              >
                <span>
                  {uploadPDF.isPending ? (
                    <>
                      <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Icons.upload className='mr-2 h-4 w-4' />
                      Replace PDF
                    </>
                  )}
                </span>
              </Button>
            </label>
            <input
              id='pdf-replace'
              type='file'
              accept='application/pdf'
              className='hidden'
              onChange={handleFileInputChange}
              disabled={uploadPDF.isPending}
            />
          </>
        )}
      </div>

      <Document
        file={currentPdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(error) => {
          console.error('PDF load error:', error);
          console.log('PDF URL:', currentPdfUrl);
        }}
        loading={
          <div className='flex items-center justify-center p-8'>
            <Icons.spinner className='h-8 w-8 animate-spin' />
            <p className='text-muted-foreground ml-2 text-sm'>Loading PDF...</p>
          </div>
        }
        error={
          <div className='text-destructive flex flex-col items-center justify-center p-8'>
            <p className='font-medium'>Failed to load PDF</p>
            <p className='text-muted-foreground mt-2 text-sm'>
              URL: {currentPdfUrl}
            </p>
            <Button
              variant='outline'
              size='sm'
              className='mt-4'
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        }
        options={pdfOptions}
        key={currentPdfUrl}
      >
        {numPages &&
          numPages > 0 &&
          pages.map((pageData) => {
            const pageNumber = pageData.pageNumber;
            // Use the mapped PDF page index if available, otherwise default to pageNumber
            // Ensure we don't exceed the actual PDF page count
            const pdfPageIndex = Math.min(
              pageData.pdfPageIndex || pageData.pageNumber,
              numPages
            );

            return (
              <div
                key={`page_container_${pageNumber}`}
                id={`page_container_${pageNumber}`}
                className='group/page relative'
              >
                {/* Page Operations Menu - Only show in edit mode */}
                {!readOnly && (
                  <div className='absolute top-2 right-2 z-20 opacity-0 transition-opacity group-hover/page:opacity-100'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='secondary'
                          size='icon'
                          className='h-8 w-8 shadow-md'
                        >
                          <Icons.ellipsis className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem>
                          <Icons.settings className='mr-2 h-4 w-4' />
                          Page properties
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            useEditorStore.getState().duplicatePage(pageNumber);
                            toast.success('Page duplicated');
                          }}
                        >
                          <Icons.page className='mr-2 h-4 w-4' />
                          Duplicate page
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (pages.length > 1) {
                              useEditorStore.getState().deletePage(pageNumber);
                              toast.success('Page deleted');
                            } else {
                              toast.error('Cannot delete the last page');
                            }
                          }}
                          className='text-destructive'
                        >
                          <Icons.trash className='mr-2 h-4 w-4' />
                          Delete page
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                <DroppablePageWrapper
                  key={`page_${pageNumber}`}
                  pageNumber={pageNumber}
                  className='mb-4'
                  fields={pageData?.fields || []}
                  documentId={documentId}
                  selectedRecipientId={selectedRecipientId}
                  scale={scale}
                  readOnly={readOnly}
                  disabled={disabled}
                  fieldValues={fieldValues}
                  onFieldChange={onFieldChange}
                  onSignatureClick={onSignatureClick}
                >
                  <Page
                    pageNumber={pdfPageIndex}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className='shadow-lg'
                    width={800 * scale}
                  />
                </DroppablePageWrapper>

                {/* Insert Page Divider - Only show in edit mode */}
                {!readOnly && (
                  <div className='absolute right-0 -bottom-4 left-0 z-10 flex h-8 items-center justify-center opacity-0 transition-opacity group-hover/page:opacity-100'>
                    <div className='bg-primary/20 absolute h-px w-full' />
                    <Button
                      variant='outline'
                      size='sm'
                      className='bg-background border-primary text-primary hover:bg-primary hover:text-primary-foreground relative z-10 h-6 w-6 rounded-full p-0 shadow-sm'
                      onClick={() => {
                        const newPage = {
                          id: `temp_page_${Date.now()}`,
                          pageNumber: pageNumber + 1,
                          width: 800,
                          height: 1100,
                          fields: []
                        };
                        useEditorStore.getState().addPage(pageNumber, newPage);
                      }}
                      title='Insert page here'
                    >
                      <Icons.add className='h-4 w-4' />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
      </Document>
    </div>
  );
}
