'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';

// Ensure worker is set up (it should be set globally in the parent, but safe to check)
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PageThumbnailsClientProps {
  pdfUrl?: string;
  currentPage: number;
  onPageSelect: (page: number) => void;
}

const pdfOptions = {
  cMapUrl: 'https://unpkg.com/pdfjs-dist@4.4.168/cmaps/',
  cMapPacked: true
};

export function PageThumbnailsClient({
  pdfUrl,
  currentPage,
  onPageSelect
}: PageThumbnailsClientProps) {
  const [numPages, setNumPages] = useState<number>(0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  if (!pdfUrl) {
    return (
      <div className='text-muted-foreground flex h-full items-center justify-center p-4 text-center text-sm'>
        Upload a PDF to see page thumbnails
      </div>
    );
  }

  return (
    <div className='bg-muted/10 flex h-full w-52 flex-col border-r'>
      <div className='bg-card border-b p-4'>
        <h3 className='text-sm font-semibold'>Pages</h3>
        <p className='text-muted-foreground text-xs'>{numPages} pages</p>
      </div>

      <div className='flex-1 space-y-4 overflow-y-auto p-4'>
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className='flex justify-center p-4'>
              <Icons.spinner className='h-6 w-6 animate-spin' />
            </div>
          }
          error={
            <div className='text-destructive text-center text-xs'>
              Failed to load thumbnails
            </div>
          }
          options={pdfOptions}
        >
          {Array.from(new Array(numPages), (el, index) => {
            const pageNum = index + 1;
            const isSelected = currentPage === pageNum;

            return (
              <div
                key={`thumb_${pageNum}`}
                className={cn(
                  'group relative flex cursor-pointer flex-col items-center gap-2 transition-all',
                  isSelected ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                )}
                onClick={() => onPageSelect(pageNum)}
              >
                <div
                  className={cn(
                    'relative shadow-sm transition-all',
                    isSelected
                      ? 'ring-primary ring-2 ring-offset-2'
                      : 'hover:ring-primary/50 hover:ring-1'
                  )}
                >
                  <div className='absolute top-2 left-2 z-10 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm'>
                    {pageNum}
                  </div>
                  <Page
                    pageNumber={pageNum}
                    width={160}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className='bg-white'
                  />
                </div>
              </div>
            );
          })}
        </Document>
      </div>
    </div>
  );
}
