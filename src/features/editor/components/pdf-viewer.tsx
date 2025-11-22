'use client';

import dynamic from 'next/dynamic';
import { Icons } from '@/components/icons';

// Dynamically import PDF viewer to avoid SSR issues
const PDFViewerClient = dynamic(
  () =>
    import('./pdf-viewer-client').then((mod) => ({
      default: mod.PDFViewerClient
    })),
  {
    ssr: false,
    loading: () => (
      <div className='flex items-center justify-center p-12'>
        <Icons.spinner className='h-8 w-8 animate-spin' />
      </div>
    )
  }
);

export interface PDFViewerProps {
  documentId: string;
  pdfUrl?: string;
  pages: Array<{
    id: string;
    pageNumber: number;
    width: number;
    height: number;
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
}

export function PDFViewer(props: PDFViewerProps) {
  return <PDFViewerClient {...props} />;
}
