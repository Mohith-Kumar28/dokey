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

interface PDFViewerProps {
  documentId: string;
  pdfUrl?: string;
  pages?: any[]; // TODO: Type this properly
  onPdfUploaded?: (url: string) => void;
}

export function PDFViewer(props: PDFViewerProps) {
  return <PDFViewerClient {...props} />;
}
